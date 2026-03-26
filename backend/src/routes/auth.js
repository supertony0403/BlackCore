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

// POST /api/auth/2fa/enable
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

// POST /api/auth/2fa/verify
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
