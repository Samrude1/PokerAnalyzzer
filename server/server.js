import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// The root database directory
const DB_DIR = path.join(__dirname, '..', 'database');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const OLD_DB_PATH = path.join(__dirname, 'database.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

// --- API Endpoints ---

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

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

    const { password: _, ...userSafe } = newUser;
    res.json(userSafe);
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...userSafe } = user;
    res.json(userSafe);
});

// Get Sessions
app.get('/api/sessions/:userId', async (req, res) => {
    const user = users.find(u => u.id === req.params.userId);
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
app.post('/api/sessions', async (req, res) => {
    const session = req.body;
    const user = users.find(u => u.id === session.userId);
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
    
    res.json({ success: true });
});

// Get Hands
app.get('/api/hands/:sessionId', async (req, res) => {
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
app.post('/api/hands', async (req, res) => {
    const { hands } = req.body;
    if (!hands || hands.length === 0) return res.json({ success: true });
    
    const handsArray = Array.isArray(hands) ? hands : [hands];
    const sessionId = handsArray[0].sessionId;
    
    const filePath = sessionIdToFile[sessionId];
    if (filePath) {
        const fileData = await readSessionFile(filePath);
        if (fileData) {
            fileData.hands.push(...handsArray);
            await writeSessionFile(filePath, fileData);
            return res.json({ success: true });
        }
    } else {
        // Fallback: If session not created yet but hands arrive (shouldn't happen with our frontend flow),
        // we log an error.
        console.error("Session file not found for hands belonging to", sessionId);
    }
    
    res.json({ success: true }); // Acknowledge to avoid client loop, even if failed
});

const PORT = 3001;
app.listen(PORT, async () => {
    await initDatabase();
    console.log(`Local Database Server running on http://localhost:${PORT}`);
});
