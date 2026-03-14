import express, { Request, Response, NextFunction } from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { appRouter } from './routers';
import { createContext } from './middleware/context';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS aberto para qualquer origem
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.IO
const io = new SocketServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'OPTIONS'] },
});
export { io };

io.on('connection', (socket) => {
  socket.on('join:trip', (id: number) => socket.join(`trip:${id}`));
  socket.on('watch:trip', (id: number) => socket.join(`trip:${id}`));
  socket.on('join:municipality', (id: number) => socket.join(`municipality:${id}`));
  socket.on('driver:location', (data: any) => {
    io.to(`trip:${data.tripId}`).emit('bus:location', data);
    io.to(`municipality:${data.municipalityId}`).emit('bus:location', data);
  });
  socket.on('driver:arrived', (data: any) => {
    io.to(`trip:${data.tripId}`).emit('stop:arrived', data);
    io.to(`municipality:${data.municipalityId}`).emit('stop:arrived', data);
  });
});

// tRPC
app.use('/api/trpc', createExpressMiddleware({ router: appRouter, createContext }));

// Health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir frontend estático SE existir (build do React)
const webDistPath = path.join(__dirname, '..', '..', '..', 'apps', 'web', 'dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: '🚌 TransEscolar API', health: '/health', trpc: '/api/trpc' });
  });
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚌 TransEscolar API rodando na porta ${PORT}`);
});

export type { AppRouter } from './routers';
