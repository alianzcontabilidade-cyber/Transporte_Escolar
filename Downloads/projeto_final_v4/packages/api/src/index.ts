import express from 'express';
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
// CORS manual — garante resposta a preflight
// ============================================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  return next();
});

app.use(express.json({ limit: '10mb' }));

// ============================================
// SOCKET.IO
// ============================================
const io = new SocketServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

export { io };

io.on('connection', (socket) => {
  socket.on('join:trip', (tripId: number) => socket.join(`trip:${tripId}`));
  socket.on('watch:trip', (tripId: number) => socket.join(`trip:${tripId}`));
  socket.on('join:municipality', (municipalityId: number) => socket.join(`municipality:${municipalityId}`));

  socket.on('driver:location', (data: any) => {
    io.to(`trip:${data.tripId}`).emit('bus:location', data);
    io.to(`municipality:${data.municipalityId}`).emit('bus:location', data);
  });

  socket.on('driver:arrived', (data: any) => {
    io.to(`trip:${data.tripId}`).emit('stop:arrived', data);
    io.to(`municipality:${data.municipalityId}`).emit('stop:arrived', data);
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
  res.json({ status: 'ok', service: 'TransEscolar API', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: '🚌 TransEscolar API', docs: '/api/trpc', health: '/health' });
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
