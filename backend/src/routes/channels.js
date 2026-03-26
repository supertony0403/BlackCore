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
const upload = multer({ storage, limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 } });

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
