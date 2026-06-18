import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { eventsRouter } from './routes/events.js';
import { sessionsRouter } from './routes/sessions.js';
import { heatmapRouter } from './routes/heatmap.js';
import { funnelsRouter } from './routes/funnels.js';
import { metricsRouter } from './routes/metrics.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Make io available to route handlers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API Routes
app.use('/api', eventsRouter);
app.use('/api', sessionsRouter);
app.use('/api', heatmapRouter);
app.use('/api', funnelsRouter);
app.use('/api', metricsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB and start server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trace';
const PORT = parseInt(process.env.PORT || '4000', 10);

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DATABASE || 'trace',
    });
    console.log('[DB] Connected to MongoDB');

    httpServer.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      console.log(`[Server] API base: http://localhost:${PORT}/api`);
      console.log(`[WS] Socket.io ready`);
    });
  } catch (err) {
    console.error('[DB] Connection failed:', err);
    process.exit(1);
  }
}

start();

export { io };
