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
