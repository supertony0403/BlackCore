import { Router } from 'express';
import { query } from '../db/index.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken);

// GET /api/servers
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

// POST /api/servers
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
