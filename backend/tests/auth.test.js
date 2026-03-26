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
