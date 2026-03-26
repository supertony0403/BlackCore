# BlackCore Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vollständiges Node.js/Express Backend mit Auth (JWT + 2FA), REST API, Socket.io Echtzeit-Chat, Datei-Upload und WebRTC Voice-Signaling.

**Architecture:** Monolith mit Express + Socket.io. PostgreSQL für Datenpersistenz. JWT Access Token (15min) + Refresh Token (7 Tage, HttpOnly Cookie). Socket.io für Echtzeit-Events (Chat, Presence, Voice-Signaling).

**Tech Stack:** Node.js, Express, Socket.io, node-postgres (pg), bcryptjs, jsonwebtoken, speakeasy (2FA/TOTP), multer (Upload), cors, cookie-parser, dotenv, vitest (Tests)

---

## File Structure

```
backend/
├── src/
│   ├── index.js                  # Express App Entry, Socket.io Init
│   ├── db/
│   │   ├── index.js              # PostgreSQL Pool
│   │   └── migrations/
│   │       └── 001_init.sql      # Vollständiges DB-Schema
│   ├── middleware/
│   │   └── auth.js               # JWT Middleware (verifyToken)
│   ├── routes/
│   │   ├── auth.js               # POST /register, /login, /logout, /refresh, /2fa/*
│   │   ├── servers.js            # GET/POST /servers, /servers/:id/channels
│   │   ├── channels.js           # GET/POST /channels/:id/messages, /upload
│   │   └── users.js              # GET/PATCH /users/@me
│   ├── socket/
│   │   ├── index.js              # Socket.io Auth + Router
│   │   ├── chat.js               # message:send, typing:start, reaction:add
│   │   └── voice.js              # voice:join, voice:signal
│   └── uploads/                  # Multer Destination (gemountet als Volume)
├── tests/
│   ├── auth.test.js
│   ├── servers.test.js
│   ├── channels.test.js
│   └── socket.test.js
├── package.json
├── .env.example
└── Dockerfile
```

---

### Task 1: Projekt-Scaffold & Dependencies

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/src/index.js`

- [ ] **Step 1: package.json erstellen**

```json
{
  "name": "blackcore-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "socket.io": "^4.7.4",
    "speakeasy": "^2.0.0",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "vitest": "^1.4.0",
    "supertest": "^6.3.4"
  }
}
```

- [ ] **Step 2: .env.example erstellen**

```env
DATABASE_URL=postgresql://blackcore:secret@postgres:5432/blackcore
JWT_SECRET=change_me_very_long_secret_here
JWT_REFRESH_SECRET=change_me_refresh_secret_here
PORT=4000
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE=104857600
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 3: src/index.js erstellen**

```js
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import channelRoutes from './routes/channels.js';
import userRoutes from './routes/users.js';
import { initSocket } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(process.env.UPLOAD_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

initSocket(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`BlackCore Backend running on :${PORT}`));

export { app, io };
```

- [ ] **Step 4: Dependencies installieren**

```bash
cd backend && npm install
```

Expected: `node_modules/` erstellt, kein Error.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: scaffold backend with express + socket.io"
```

---

### Task 2: PostgreSQL Datenbankverbindung & Schema

**Files:**
- Create: `backend/src/db/index.js`
- Create: `backend/src/db/migrations/001_init.sql`

- [ ] **Step 1: Failing Test schreiben**

`backend/tests/db.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { query } from '../src/db/index.js';

describe('DB Connection', () => {
  it('should connect and return result', async () => {
    const result = await query('SELECT 1 AS val');
    expect(result.rows[0].val).toBe(1);
  });
});
```

- [ ] **Step 2: Test fehlschlagen lassen**

```bash
cd backend && npm test tests/db.test.js
```

Expected: FAIL — "Cannot find module '../src/db/index.js'"

- [ ] **Step 3: DB Pool erstellen**

`backend/src/db/index.js`:
```js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const query = (text, params) => pool.query(text, params);
export default pool;
```

- [ ] **Step 4: SQL-Schema erstellen**

`backend/src/db/migrations/001_init.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) UNIQUE NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  banner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_2fa (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_members (
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (server_id, user_id)
);

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) DEFAULT 'text' CHECK (type IN ('text', 'voice')),
  position INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  size BIGINT,
  mimetype TEXT
);

CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('spotify', 'github')),
  provider_id TEXT NOT NULL,
  data JSONB,
  UNIQUE(user_id, provider)
);
```

- [ ] **Step 5: Schema in DB ausführen (PostgreSQL muss laufen)**

```bash
psql $DATABASE_URL -f backend/src/db/migrations/001_init.sql
```

Expected: `CREATE TABLE` Ausgaben, kein Error.

- [ ] **Step 6: Test laufen lassen**

```bash
cd backend && npm test tests/db.test.js
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/db/ backend/tests/db.test.js
git commit -m "feat: add postgresql connection and schema migration"
```

---

### Task 3: JWT Auth Middleware

**Files:**
- Create: `backend/src/middleware/auth.js`
- Create: `backend/tests/auth.test.js` (Teil 1)

- [ ] **Step 1: Failing Test schreiben**

`backend/tests/auth.test.js` (nur Middleware-Teil):
```js
import { describe, it, expect } from 'vitest';
import { verifyToken } from '../src/middleware/auth.js';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test_secret';

describe('verifyToken middleware', () => {
  it('calls next() with valid token', () => {
    const token = jwt.sign({ userId: 'abc', email: 'a@b.com' }, 'test_secret', { expiresIn: '15m' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: (c) => ({ json: (m) => ({ code: c, msg: m }) }) };
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    verifyToken(req, res, next);
    expect(nextCalled).toBe(true);
    expect(req.user.userId).toBe('abc');
  });

  it('returns 401 with missing token', () => {
    const req = { headers: {} };
    let statusCode = null;
    const res = { status: (c) => { statusCode = c; return { json: () => {} }; } };
    verifyToken(req, res, () => {});
    expect(statusCode).toBe(401);
  });
});
```

- [ ] **Step 2: Test fehlschlagen lassen**

```bash
cd backend && npm test tests/auth.test.js
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Middleware implementieren**

`backend/src/middleware/auth.js`:
```js
import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

- [ ] **Step 4: Tests laufen lassen**

```bash
cd backend && npm test tests/auth.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/auth.js backend/tests/auth.test.js
git commit -m "feat: add JWT auth middleware"
```

---

### Task 4: Auth Routes (Register, Login, Logout, Refresh, 2FA)

**Files:**
- Create: `backend/src/routes/auth.js`

- [ ] **Step 1: Route-Datei erstellen**

`backend/src/routes/auth.js`:
```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query } from '../db/index.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

function generateTokens(userId, email) {
  const access = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { access, refresh };
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, display_name, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (username, display_name, email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id, username, display_name, email, created_at`,
      [username, display_name || username, email, hash]
    );
    const user = result.rows[0];
    const { access, refresh } = generateTokens(user.id, user.email);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refresh]
    );
    setRefreshCookie(res, refresh);
    res.status(201).json({ user, token: access });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, totp_code } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const twofa = await query('SELECT * FROM user_2fa WHERE user_id = $1 AND enabled = TRUE', [user.id]);
    if (twofa.rows.length > 0) {
      if (!totp_code) return res.status(200).json({ requires_2fa: true });
      const verified = speakeasy.totp.verify({ secret: twofa.rows[0].secret, encoding: 'base32', token: totp_code });
      if (!verified) return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    const { access, refresh } = generateTokens(user.id, user.email);
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refresh]
    );
    setRefreshCookie(res, refresh);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token: access });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const stored = await query('SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2', [token, payload.userId]);
    if (!stored.rows.length) return res.status(401).json({ error: 'Invalid refresh token' });
    const userResult = await query('SELECT id, email FROM users WHERE id = $1', [payload.userId]);
    const user = userResult.rows[0];
    const { access, refresh } = generateTokens(user.id, user.email);
    await query('UPDATE refresh_tokens SET token = $1, expires_at = NOW() + INTERVAL \'7 days\' WHERE token = $2', [refresh, token]);
    setRefreshCookie(res, refresh);
    res.json({ token: access });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/2fa/enable  — Erstellt TOTP Secret, gibt QR zurück
router.post('/2fa/enable', verifyToken, async (req, res) => {
  const secret = speakeasy.generateSecret({ name: `BlackCore (${req.user.email})` });
  await query(
    `INSERT INTO user_2fa (user_id, secret, enabled) VALUES ($1, $2, FALSE)
     ON CONFLICT (user_id) DO UPDATE SET secret = $2, enabled = FALSE`,
    [req.user.userId, secret.base32]
  );
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  res.json({ secret: secret.base32, qr: qrCode });
});

// POST /api/auth/2fa/verify  — Aktiviert 2FA nach Bestätigung des Codes
router.post('/2fa/verify', verifyToken, async (req, res) => {
  const { code } = req.body;
  const result = await query('SELECT secret FROM user_2fa WHERE user_id = $1', [req.user.userId]);
  if (!result.rows.length) return res.status(400).json({ error: '2FA not set up' });
  const verified = speakeasy.totp.verify({ secret: result.rows[0].secret, encoding: 'base32', token: code });
  if (!verified) return res.status(400).json({ error: 'Invalid code' });
  await query('UPDATE user_2fa SET enabled = TRUE WHERE user_id = $1', [req.user.userId]);
  res.json({ message: '2FA enabled' });
});

// POST /api/auth/2fa/disable
router.post('/2fa/disable', verifyToken, async (req, res) => {
  await query('DELETE FROM user_2fa WHERE user_id = $1', [req.user.userId]);
  res.json({ message: '2FA disabled' });
});

export default router;
```

- [ ] **Step 2: Health Check testen**

```bash
cd backend && node src/index.js &
curl http://localhost:4000/api/health
```

Expected: `{"status":"ok"}`

```bash
kill %1
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/auth.js
git commit -m "feat: add auth routes (register, login, logout, refresh, 2FA)"
```

---

### Task 5: Server & Channel Routes

**Files:**
- Create: `backend/src/routes/servers.js`
- Create: `backend/src/routes/channels.js`

- [ ] **Step 1: servers.js erstellen**

`backend/src/routes/servers.js`:
```js
import { Router } from 'express';
import { query } from '../db/index.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

// GET /api/servers — Alle Server des Users
router.get('/', async (req, res) => {
  const result = await query(
    `SELECT s.* FROM servers s
     JOIN server_members sm ON sm.server_id = s.id
     WHERE sm.user_id = $1
     ORDER BY s.created_at`,
    [req.user.userId]
  );
  res.json(result.rows);
});

// POST /api/servers — Neuen Server erstellen
router.post('/', async (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const serverResult = await query(
    `INSERT INTO servers (name, icon, owner_id) VALUES ($1, $2, $3) RETURNING *`,
    [name, icon || null, req.user.userId]
  );
  const server = serverResult.rows[0];
  await query(
    `INSERT INTO server_members (server_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [server.id, req.user.userId]
  );
  // Standardkanäle anlegen
  await query(
    `INSERT INTO channels (server_id, name, type, position) VALUES
     ($1, 'general', 'text', 0),
     ($1, 'announcements', 'text', 1),
     ($1, 'voice-chat', 'voice', 2)`,
    [server.id]
  );
  res.status(201).json(server);
});

// GET /api/servers/:id/channels
router.get('/:id/channels', async (req, res) => {
  const membership = await query(
    'SELECT 1 FROM server_members WHERE server_id = $1 AND user_id = $2',
    [req.params.id, req.user.userId]
  );
  if (!membership.rows.length) return res.status(403).json({ error: 'Not a member' });
  const result = await query(
    'SELECT * FROM channels WHERE server_id = $1 ORDER BY position',
    [req.params.id]
  );
  res.json(result.rows);
});

// POST /api/servers/:id/channels
router.post('/:id/channels', async (req, res) => {
  const { name, type = 'text' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const server = await query('SELECT * FROM servers WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.userId]);
  if (!server.rows.length) return res.status(403).json({ error: 'Not owner' });
  const result = await query(
    'INSERT INTO channels (server_id, name, type) VALUES ($1, $2, $3) RETURNING *',
    [req.params.id, name, type]
  );
  res.status(201).json(result.rows[0]);
});

// POST /api/servers/:id/join
router.post('/:id/join', async (req, res) => {
  try {
    await query(
      `INSERT INTO server_members (server_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Joined server' });
  } catch {
    res.status(500).json({ error: 'Could not join server' });
  }
});

export default router;
```

- [ ] **Step 2: channels.js erstellen**

`backend/src/routes/channels.js`:
```js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db/index.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_DIR || './src/uploads',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) } });

async function checkChannelAccess(channelId, userId) {
  const result = await query(
    `SELECT 1 FROM server_members sm
     JOIN channels c ON c.server_id = sm.server_id
     WHERE c.id = $1 AND sm.user_id = $2`,
    [channelId, userId]
  );
  return result.rows.length > 0;
}

// GET /api/channels/:id/messages
router.get('/:id/messages', async (req, res) => {
  const access = await checkChannelAccess(req.params.id, req.user.userId);
  if (!access) return res.status(403).json({ error: 'No access' });
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before;
  const result = await query(
    `SELECT m.*, u.username, u.display_name, u.avatar,
            json_agg(DISTINCT jsonb_build_object('id', a.id, 'filename', a.filename, 'url', a.url, 'size', a.size, 'mimetype', a.mimetype))
              FILTER (WHERE a.id IS NOT NULL) AS attachments,
            json_agg(DISTINCT jsonb_build_object('emoji', r.emoji, 'count', (SELECT COUNT(*) FROM reactions r2 WHERE r2.message_id = m.id AND r2.emoji = r.emoji)))
              FILTER (WHERE r.id IS NOT NULL) AS reactions
     FROM messages m
     JOIN users u ON u.id = m.author_id
     LEFT JOIN attachments a ON a.message_id = m.id
     LEFT JOIN reactions r ON r.message_id = m.id
     WHERE m.channel_id = $1 ${before ? 'AND m.created_at < $3' : ''}
     GROUP BY m.id, u.username, u.display_name, u.avatar
     ORDER BY m.created_at DESC LIMIT $2`,
    before ? [req.params.id, limit, before] : [req.params.id, limit]
  );
  res.json(result.rows.reverse());
});

// POST /api/channels/:id/messages
router.post('/:id/messages', async (req, res) => {
  const access = await checkChannelAccess(req.params.id, req.user.userId);
  if (!access) return res.status(403).json({ error: 'No access' });
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
  const result = await query(
    `INSERT INTO messages (channel_id, author_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, req.user.userId, content.trim()]
  );
  res.status(201).json(result.rows[0]);
});

// POST /api/channels/:id/upload
router.post('/:id/upload', upload.single('file'), async (req, res) => {
  const access = await checkChannelAccess(req.params.id, req.user.userId);
  if (!access) return res.status(403).json({ error: 'No access' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const msgResult = await query(
    `INSERT INTO messages (channel_id, author_id, content) VALUES ($1, $2, '') RETURNING id`,
    [req.params.id, req.user.userId]
  );
  const messageId = msgResult.rows[0].id;
  const url = `/uploads/${req.file.filename}`;

  const attResult = await query(
    `INSERT INTO attachments (message_id, filename, url, size, mimetype) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [messageId, req.file.originalname, url, req.file.size, req.file.mimetype]
  );
  res.status(201).json({ messageId, attachment: attResult.rows[0] });
});

// POST /api/channels/:id/reactions
router.post('/:id/reactions', async (req, res) => {
  const { messageId, emoji } = req.body;
  try {
    await query(
      `INSERT INTO reactions (message_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [messageId, req.user.userId, emoji]
    );
    res.json({ message: 'Reaction added' });
  } catch {
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/servers.js backend/src/routes/channels.js
git commit -m "feat: add server and channel REST routes"
```

---

### Task 6: User Routes

**Files:**
- Create: `backend/src/routes/users.js`

- [ ] **Step 1: users.js erstellen**

`backend/src/routes/users.js`:
```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

// GET /api/users/@me
router.get('/@me', async (req, res) => {
  const result = await query(
    `SELECT id, username, display_name, email, avatar, banner, created_at FROM users WHERE id = $1`,
    [req.user.userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  const twofa = await query('SELECT enabled FROM user_2fa WHERE user_id = $1', [req.user.userId]);
  const accounts = await query('SELECT provider FROM connected_accounts WHERE user_id = $1', [req.user.userId]);
  res.json({
    ...result.rows[0],
    two_fa_enabled: twofa.rows[0]?.enabled || false,
    connected_accounts: accounts.rows.map(r => r.provider)
  });
});

// PATCH /api/users/@me
router.patch('/@me', async (req, res) => {
  const { display_name, avatar, banner, password, new_password } = req.body;
  const updates = [];
  const values = [];

  if (display_name) { updates.push(`display_name = $${values.length + 1}`); values.push(display_name); }
  if (avatar !== undefined) { updates.push(`avatar = $${values.length + 1}`); values.push(avatar); }
  if (banner !== undefined) { updates.push(`banner = $${values.length + 1}`); values.push(banner); }

  if (password && new_password) {
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
    const valid = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    updates.push(`password_hash = $${values.length + 1}`);
    values.push(hash);
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  values.push(req.user.userId);
  const result = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id, username, display_name, email, avatar, banner`,
    values
  );
  res.json(result.rows[0]);
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const result = await query(
    'SELECT id, username, display_name, avatar FROM users WHERE id = $1',
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/users.js
git commit -m "feat: add user routes (profile, password change)"
```

---

### Task 7: Socket.io — Chat & Presence

**Files:**
- Create: `backend/src/socket/index.js`
- Create: `backend/src/socket/chat.js`
- Create: `backend/src/socket/voice.js`

- [ ] **Step 1: Socket Auth & Router**

`backend/src/socket/index.js`:
```js
import jwt from 'jsonwebtoken';
import { registerChatHandlers } from './chat.js';
import { registerVoiceHandlers } from './voice.js';

export function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.userId}`);
    io.emit('user:online', { userId: socket.user.userId });

    registerChatHandlers(io, socket);
    registerVoiceHandlers(io, socket);

    socket.on('disconnect', () => {
      io.emit('user:offline', { userId: socket.user.userId });
    });
  });
}
```

- [ ] **Step 2: Chat Handler**

`backend/src/socket/chat.js`:
```js
import { query } from '../db/index.js';

export function registerChatHandlers(io, socket) {
  socket.on('channel:join', (channelId) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('channel:leave', (channelId) => {
    socket.leave(`channel:${channelId}`);
  });

  socket.on('message:send', async ({ channelId, content }) => {
    if (!content?.trim() || !channelId) return;
    try {
      const result = await query(
        `INSERT INTO messages (channel_id, author_id, content) VALUES ($1, $2, $3) RETURNING *`,
        [channelId, socket.user.userId, content.trim()]
      );
      const userResult = await query(
        'SELECT username, display_name, avatar FROM users WHERE id = $1',
        [socket.user.userId]
      );
      const message = { ...result.rows[0], ...userResult.rows[0], attachments: [], reactions: [] };
      io.to(`channel:${channelId}`).emit('message:new', message);
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing:start', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('typing:update', {
      channelId,
      userId: socket.user.userId
    });
  });

  socket.on('reaction:add', async ({ messageId, emoji }) => {
    try {
      await query(
        `INSERT INTO reactions (message_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [messageId, socket.user.userId, emoji]
      );
      const msg = await query('SELECT channel_id FROM messages WHERE id = $1', [messageId]);
      if (msg.rows.length) {
        io.to(`channel:${msg.rows[0].channel_id}`).emit('reaction:new', {
          messageId, emoji, userId: socket.user.userId
        });
      }
    } catch {
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });
}
```

- [ ] **Step 3: Voice Signaling Handler**

`backend/src/socket/voice.js`:
```js
// Voice Channel Signaling via WebRTC (Peer-to-Peer)
// STUN: Google Public Servers (kein eigenes Hosting)
const voiceRooms = new Map(); // channelId => Set<socketId>

export function registerVoiceHandlers(io, socket) {
  socket.on('voice:join', ({ channelId }) => {
    const room = `voice:${channelId}`;
    const existing = [...(voiceRooms.get(channelId) || [])];
    socket.join(room);

    if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Set());
    voiceRooms.get(channelId).add(socket.id);

    // Teile dem neuen Teilnehmer alle vorhandenen Peers mit
    existing.forEach(peerId => {
      socket.emit('voice:peer-joined', { peerId });
      io.to(peerId).emit('voice:peer-joined', { peerId: socket.id });
    });

    socket.on('disconnect', () => {
      voiceRooms.get(channelId)?.delete(socket.id);
      io.to(room).emit('voice:peer-left', { peerId: socket.id });
    });
  });

  // WebRTC Signal weiterleiten (offer, answer, ICE candidates)
  socket.on('voice:signal', ({ peerId, signal }) => {
    io.to(peerId).emit('voice:signal', { peerId: socket.id, signal });
  });

  socket.on('voice:leave', ({ channelId }) => {
    const room = `voice:${channelId}`;
    socket.leave(room);
    voiceRooms.get(channelId)?.delete(socket.id);
    io.to(room).emit('voice:peer-left', { peerId: socket.id });
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/socket/
git commit -m "feat: add socket.io chat, presence and WebRTC voice signaling"
```

---

### Task 8: Dockerfile & .gitignore

**Files:**
- Create: `backend/Dockerfile`
- Create: `.gitignore`

- [ ] **Step 1: Dockerfile erstellen**

`backend/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
RUN mkdir -p ./src/uploads
EXPOSE 4000
CMD ["node", "src/index.js"]
```

- [ ] **Step 2: .gitignore erstellen**

`.gitignore` (im Root):
```
node_modules/
.env
*.log
backend/src/uploads/*
!backend/src/uploads/.gitkeep
dist/
```

- [ ] **Step 3: .gitkeep für uploads**

```bash
touch backend/src/uploads/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add backend/Dockerfile .gitignore backend/src/uploads/.gitkeep
git commit -m "feat: add backend Dockerfile and gitignore"
```

---

### Task 9: Abschluss-Test & GitHub Push

- [ ] **Step 1: Alle Tests laufen lassen**

```bash
cd backend && npm test
```

Expected: Alle Tests PASS.

- [ ] **Step 2: GitHub Repo erstellen und pushen**

```bash
source ~/.config/envman/PATH.env
cd /home/tony/Documents/Programmierung/BlackCore
gh repo create BlackCore --public --source=. --remote=origin --push
```

Expected: Repo erstellt auf github.com/supertony0403/BlackCore, Code gepusht.

---

## Nächster Plan

Weiter mit: `docs/superpowers/plans/2026-03-27-blackcore-frontend.md`
