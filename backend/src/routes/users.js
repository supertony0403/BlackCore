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
