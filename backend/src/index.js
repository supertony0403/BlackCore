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

// Umgebungsvariablen validieren
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './src/uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Globale Error-Handling-Middleware
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

initSocket(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`BlackCore Backend running on :${PORT}`));

// Graceful Shutdown
const shutdown = () => {
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app, io };
