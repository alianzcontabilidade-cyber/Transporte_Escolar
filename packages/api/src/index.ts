import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import * as dotenv from 'dotenv';
import { appRouter } from './routers';
import { createContext } from './middleware/context';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ============================================
// CORS — aceita qualquer origem em produção
// ============================================
app.use(cors({
  origin: true, // permite qualquer origem
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ============================================
// SOCKET.IO
// ============================================
const io = new SocketServer(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

export { io };

io.on('connection', (socket) => {
  console.log(`[Socket] Cliente conectado: ${socket.id}`);

  socket.on('join:trip', (tripId: number) => {
    socket.join(`trip:${tripId}`);
  });

  socket.on('watch:trip', (tripId: number) => {
    socket.join(`trip:${tripId}`);
  });

  socket.on('join:municipality', (municipalityId: number) => {
    socket.join(`municipality:${municipalityId}`);
  });

  socket.on('driver:location', (data: {
    tripId: number;
    driverId: number;
    municipalityId: number;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  }) => {
    io.to(`trip:${data.tripId}`).emit('bus:location', data);
    io.to(`municipality:${data.municipalityId}`).emit('bus:location', data);
  });

  socket.on('driver:arrived', (data: {
    tripId: number;
    stopId: number;
    municipalityId: number;
    stopName: string;
  }) => {
    io.to(`trip:${data.tripId}`).emit('stop:arrived', data);
    io.to(`municipality:${data.municipalityId}`).emit('stop:arrived', data);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
  });
});

// ============================================
// tRPC
// ============================================
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// ============================================
// Health Check
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TransEscolar API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚌 TransEscolar API',
    docs: '/api/trpc',
    health: '/health'
  });
});

// ============================================
// START
// ============================================
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`\n🚌 TransEscolar API rodando na porta ${PORT}`);
  console.log(`📡 WebSocket (Socket.io) ativo`);
  console.log(`🔗 tRPC: http://localhost:${PORT}/api/trpc`);
  console.log(`💚 Health: http://localhost:${PORT}/health\n`);
});

export type { AppRouter } from './routers';
