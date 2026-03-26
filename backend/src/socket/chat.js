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
