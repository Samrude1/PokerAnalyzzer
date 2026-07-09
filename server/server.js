import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AIAnalyzer } from './services/AIAnalyzer.js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

// The root database directory
const DB_DIR = path.join(__dirname, '..', 'database');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const OLD_DB_PATH = path.join(__dirname, 'database.json');

const app = express();

// Security Headers
app.use(helmet());

// Strict CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Rate Limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 login/register requests per window
    message: { error: 'Too many authentication attempts. Please try again later.' }
});

const coachLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 coach requests per window
    message: { error: 'Coach rate limit exceeded. Please try again later.' }
});

const aiAnalyzer = new AIAnalyzer(DB_DIR);

// In-memory cache
let users = [];
// sessionId -> file path
let sessionIdToFile = {};

// Helper: Format date to DDMMYYYY
function getDDMMYYYY(isoString) {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}${month}${year}`;
}

// Helper: Ensure directory exists
async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }
}

// Init database
async function initDatabase() {
    await ensureDir(DB_DIR);
    
    // Check for migration
    try {
        await fs.access(OLD_DB_PATH);
        console.log("Found old database.json. Starting migration...");
        await migrateDatabase();
        console.log("Migration complete!");
    } catch (e) {
        // No old DB found, proceed normally
    }

    // Load users
    try {
        const usersData = await fs.readFile(USERS_FILE, 'utf-8');
        users = JSON.parse(usersData);
    } catch (e) {
        users = [];
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 4), 'utf-8');
    }

    // Scan for sessions to build cache
    await scanSessions(DB_DIR);
}

// Migration Logic
async function migrateDatabase() {
    const oldDataRaw = await fs.readFile(OLD_DB_PATH, 'utf-8');
    const oldDb = JSON.parse(oldDataRaw);
    
    // Write users
    users = oldDb.users || [];
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 4), 'utf-8');
    
    // Migrate sessions
    const sessions = oldDb.sessions || [];
    const hands = oldDb.hands || [];
    
    for (const session of sessions) {
        const user = users.find(u => u.id === session.userId);
        if (!user) continue;
        
        const username = user.username.toLowerCase();
        const mode = session.mode || 'cash';
        const dateStr = getDDMMYYYY(session.date);
        const sessionDir = path.join(DB_DIR, username, mode, 'sessions', dateStr);
        await ensureDir(sessionDir);
        
        const sessionHands = hands.filter(h => h.sessionId === session.id);
        const filePath = path.join(sessionDir, `${session.id}.json`);
        
        await fs.writeFile(filePath, JSON.stringify({
            session: session,
            hands: sessionHands
        }, null, 4), 'utf-8');
    }
    
    // Rename old DB so we don't migrate again
    await fs.rename(OLD_DB_PATH, OLD_DB_PATH + '.bak');
}

// Recursive scan to build sessionIdToFile cache
async function scanSessions(dir) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scanSessions(fullPath);
            } else if (entry.isFile() && entry.name.startsWith('sess_') && entry.name.endsWith('.json')) {
                const sessionId = entry.name.replace('.json', '');
                sessionIdToFile[sessionId] = fullPath;
            }
        }
    } catch (e) {
        console.error("Error scanning directory:", dir, e);
    }
}

// Read a specific session file
async function readSessionFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

// Write to a specific session file
async function writeSessionFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf-8');
}

// --- Validation Schemas ---
const RegisterSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

const LoginSchema = z.object({
    username: z.string(),
    password: z.string()
});

const SessionSchema = z.object({
    id: z.string(),
    userId: z.string().optional(),
    mode: z.string().optional(),
    date: z.string()
}).passthrough();

const HandsSchema = z.object({
    hands: z.any()
});

const ChatSchema = z.object({
    question: z.string(),
    actionType: z.string().optional(),
    contextSessionId: z.string().optional()
});

// --- Middleware ---
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
        req.user = user;
        next();
    });
}

// --- API Endpoints ---

// Register
app.post('/api/register', authLimiter, async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    const { username, password } = parsed.data;

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = {
        id: 'u_' + Date.now() + Math.random().toString(36).substr(2, 5),
        username,
        password,
        isPro: true
    };

    users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 4), 'utf-8');

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userSafe } = newUser;
    res.json({ ...userSafe, token });
});

// Login
app.post('/api/login', authLimiter, async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    const { username, password } = parsed.data;
    
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userSafe } = user;
    res.json({ ...userSafe, token });
});

// Get Sessions
app.get('/api/sessions', verifyToken, async (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.json([]);

    const username = user.username.toLowerCase();
    const userDir = path.join(DB_DIR, username);
    
    const userSessions = [];
    
    async function scanUserSessions(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await scanUserSessions(fullPath);
                } else if (entry.isFile() && entry.name.startsWith('sess_') && entry.name.endsWith('.json')) {
                    const fileData = await readSessionFile(fullPath);
                    if (fileData && fileData.session) {
                        userSessions.push(fileData.session);
                    }
                }
            }
        } catch (e) {
            // directory might not exist yet
        }
    }
    
    await scanUserSessions(userDir);
    userSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json(userSessions);
});

// Save Session
app.post('/api/sessions', verifyToken, async (req, res) => {
    const parsed = SessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    
    const session = parsed.data;
    session.userId = req.user.id; // Enforce security, ignore client payload userId

    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const username = user.username.toLowerCase();
    const mode = session.mode || 'cash';
    const dateStr = getDDMMYYYY(session.date);
    
    const sessionDir = path.join(DB_DIR, username, mode, 'sessions', dateStr);
    await ensureDir(sessionDir);
    
    const filePath = path.join(sessionDir, `${session.id}.json`);
    
    let existingData = await readSessionFile(filePath);
    if (!existingData) {
        existingData = { session: session, hands: [] };
    } else {
        existingData.session = session;
    }
    
    await writeSessionFile(filePath, existingData);
    
    // Update cache
    sessionIdToFile[session.id] = filePath;

    // No more vector indexing
    // ragPipeline.indexSession(user.id, session, user.username);
    
    res.json({ success: true });
});

// Delete Session
app.delete('/api/sessions/:sessionId', verifyToken, async (req, res) => {
    const sessionId = req.params.sessionId;
    const filePath = sessionIdToFile[sessionId];
    
    if (filePath) {
        const user = users.find(u => u.id === req.user.id);
        const usernameFolder = user ? `/${user.username.toLowerCase()}/` : '';
        const usernameFolderWin = user ? `\\${user.username.toLowerCase()}\\` : '';
        if (!user || (!filePath.includes(usernameFolder) && !filePath.includes(usernameFolderWin))) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        try {
            await fs.unlink(filePath);
            delete sessionIdToFile[sessionId];
            res.json({ success: true });
        } catch (e) {
            console.error("Error deleting session:", e);
            res.status(500).json({ error: 'Failed to delete session' });
        }
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

// Get Hands
app.get('/api/hands/:sessionId', verifyToken, async (req, res) => {
    const sessionId = req.params.sessionId;
    const filePath = sessionIdToFile[sessionId];
    
    if (filePath) {
        const fileData = await readSessionFile(filePath);
        if (fileData && fileData.hands) {
            return res.json(fileData.hands);
        }
    }
    res.json([]);
});

// Save Hands
app.post('/api/hands', verifyToken, async (req, res) => {
    const parsed = HandsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
    
    const { hands } = parsed.data;
    if (!hands || hands.length === 0) return res.json({ success: true });
    
    const handsArray = Array.isArray(hands) ? hands : [hands];
    const sessionId = handsArray[0].sessionId;
    
    const filePath = sessionIdToFile[sessionId];
    if (filePath) {
        const fileData = await readSessionFile(filePath);
        if (fileData) {
            fileData.hands.push(...handsArray);
            await writeSessionFile(filePath, fileData);

            // No more vector indexing
            // for (const h of handsArray) {
            //     ragPipeline.indexHand(fileData.session.userId, h, username);
            // }

            return res.json({ success: true });
        }
    } else {
        // Fallback: If session not created yet but hands arrive (shouldn't happen with our frontend flow),
        // we log an error.
        console.error("Session file not found for hands belonging to", sessionId);
    }
    
    res.json({ success: true }); // Acknowledge to avoid client loop, even if failed
});

// --- AI Coach Endpoints ---

// Check API Health
app.get('/api/coach/health', async (req, res) => {
    res.json({ status: 'online', models: { hasChat: true, hasEmbed: false } });
});

// Chat Stream
app.post('/api/coach/chat', verifyToken, coachLimiter, async (req, res) => {
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    const { question, actionType, contextSessionId } = parsed.data;
    
    const userId = req.user.id;
    
    // Validate user exists (security check)
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    await aiAnalyzer.analyze(user, question, res, actionType, contextSessionId, sessionIdToFile);
});

const PORT = 3001;
app.listen(PORT, async () => {
    await initDatabase();
    console.log(`Local Database Server running on http://localhost:${PORT}`);
});
