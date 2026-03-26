import { describe, it, expect } from 'vitest';
import { query } from '../src/db/index.js';

describe('DB Connection', () => {
  it('should connect and return result', async () => {
    const result = await query('SELECT 1 AS val');
    expect(result.rows[0].val).toBe(1);
  });
});
