import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as trpcExpress from '@trpc/server/adapters/express';
import path from 'path';
import * as dotenv from 'dotenv';
import { appRouter } from './routers';
import { createContext } from './middleware/context';
import { setSocketIO } from './socketInstance';

dotenv.config();

// ============================================
// EXPRESS + TRPC + SOCKET.IO SERVER
// ============================================
const app = express();
const httpServer = createServer(app);

// CORS whitelist - allow same-origin (frontend served by same server) + configured origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(o => o.trim());

const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (same-origin, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return callback(null, true);
    // In production, allow same domain
    if (process.env.RAILWAY_PUBLIC_DOMAIN && origin.includes(process.env.RAILWAY_PUBLIC_DOMAIN)) return callback(null, true);
    // Allow any railway.app domain
    if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) return callback(null, true);
    callback(null, true); // Allow all for now - tighten in production
  },
  credentials: true,
};

// Socket.IO
const io = new Server(httpServer, {
  cors: { origin: corsOptions.origin as any, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling'],
});

// Compartilhar instância do Socket.IO com os routers
setSocketIO(io);

// CORS
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Request timeout (30 seconds)
app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.1.0', timestamp: new Date().toISOString() });
});

// tRPC
app.use('/api/trpc', trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Socket.IO events
io.on('connection', (socket) => {
  console.log('🔌 Socket conectado:', socket.id);

  socket.on('join:municipality', (municipalityId: number) => {
    socket.join(`municipality:${municipalityId}`);
  });

  // Manter compatibilidade com emissões diretas do cliente
  socket.on('bus:location', (data: any) => {
    if (data.municipalityId) {
      socket.to(`municipality:${data.municipalityId}`).emit('bus:location', data);
    }
  });

  socket.on('stop:arrived', (data: any) => {
    if (data.municipalityId) {
      io.to(`municipality:${data.municipalityId}`).emit('stop:arrived', data);
    }
  });

  socket.on('student:boarded', (data: any) => {
    if (data.municipalityId) {
      io.to(`municipality:${data.municipalityId}`).emit('student:boarded', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket desconectado:', socket.id);
  });
});

// Serve frontend estático (produção)
// Em produção (Railway), o frontend fica em /app/public
// Em desenvolvimento, fica em ../../apps/web/dist
const frontendPath = path.resolve(__dirname, '../public/index.html')
  ? path.resolve(__dirname, '../public')
  : path.resolve(__dirname, '../../apps/web/dist');
// Fallback: tentar ambos os caminhos
const fs = require('fs');
const finalFrontendPath = fs.existsSync(path.resolve(__dirname, '../public/index.html'))
  ? path.resolve(__dirname, '../public')
  : path.resolve(__dirname, '../../apps/web/dist');
app.use(express.static(finalFrontendPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(finalFrontendPath, 'index.html'));
});

// ============================================
// START SERVER
// ============================================
const PORT = parseInt(process.env.PORT || '3000', 10);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NetEscol API v2.2.0 rodando na porta ${PORT}`);
  console.log(`📡 Socket.IO ativo`);
  console.log(`🌐 Frontend servido de: ${finalFrontendPath}`);
});
