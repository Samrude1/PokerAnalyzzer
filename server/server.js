import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

const app = express();
app.use(cors());
app.use(express.json());

// Helper to read DB
async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return { users: [], sessions: [], hands: [] };
    }
}

// Helper to write DB
async function writeDB(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 4), 'utf-8');
}

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const db = await readDB();
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = {
        id: 'u_' + Date.now() + Math.random().toString(36).substr(2, 5),
        username,
        password, // Stored in plain text for this local toy app
        isPro: true
    };

    db.users.push(newUser);
    await writeDB(db);

    const { password: _, ...userSafe } = newUser;
    res.json(userSafe);
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...userSafe } = user;
    res.json(userSafe);
});

// Get Sessions
app.get('/api/sessions/:userId', async (req, res) => {
    const db = await readDB();
    const userSessions = db.sessions.filter(s => s.userId === req.params.userId);
    res.json(userSessions);
});

// Save Session
app.post('/api/sessions', async (req, res) => {
    const session = req.body;
    const db = await readDB();
    db.sessions.push(session);
    await writeDB(db);
    res.json({ success: true });
});

// Get Hands
app.get('/api/hands/:sessionId', async (req, res) => {
    const db = await readDB();
    const sessionHands = db.hands.filter(h => h.sessionId === req.params.sessionId);
    res.json(sessionHands);
});

// Save Hands
app.post('/api/hands', async (req, res) => {
    const { hands } = req.body;
    const db = await readDB();
    if (Array.isArray(hands)) {
        db.hands.push(...hands);
    } else {
        db.hands.push(hands);
    }
    await writeDB(db);
    res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local Database Server running on http://localhost:${PORT}`);
});
