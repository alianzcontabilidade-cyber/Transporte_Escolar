import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as trpcExpress from '@trpc/server/adapters/express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import * as dotenv from 'dotenv';
import { appRouter } from './routers';
import { createContext } from './middleware/context';
import { setSocketIO } from './socketInstance';
import { db } from './db/index';
import { sql } from 'drizzle-orm';

dotenv.config();

// ============================================
// SENTRY - MONITORAMENTO DE ERROS
// ============================================
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: 'netescol@3.1.0',
    tracesSampleRate: 0.2,
    beforeSend(event) {
      // Não enviar erros de rate limit ou CORS
      if (event.message?.includes('rate limit') || event.message?.includes('CORS')) return null;
      return event;
    },
  });
  console.log('📊 Sentry ativo - monitoramento de erros habilitado');
} else {
  console.log('📊 Sentry não configurado (defina SENTRY_DSN para ativar)');
}

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
    // Sem origin = mesma origem (frontend servido pelo mesmo servidor), mobile apps, curl
    if (!origin) return callback(null, true);
    // Origens configuradas via variável de ambiente
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return callback(null, true);
    // Domínio do Railway (produção)
    if (process.env.RAILWAY_PUBLIC_DOMAIN && origin.includes(process.env.RAILWAY_PUBLIC_DOMAIN)) return callback(null, true);
    // Subdomínios do Railway (*.railway.app)
    if (origin.endsWith('.railway.app') || origin.endsWith('.up.railway.app')) return callback(null, true);
    // Localhost para desenvolvimento
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return callback(null, true);
    // Bloquear origens desconhecidas
    console.warn(`CORS bloqueado para origem: ${origin}`);
    callback(new Error('Origem não permitida pelo CORS'));
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

// ============================================
// RATE LIMITING
// ============================================

// Rate limit para login: 5 tentativas / 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// Rate limit para registro: 3 tentativas / hora por IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Limite de cadastros atingido. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// Rate limit geral da API: 200 requisições / min por IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Limite de requisições atingido. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// Aplicar rate limit por tipo de procedure tRPC
app.use('/api/trpc/auth.login', loginLimiter);
app.use('/api/trpc/auth.registerMunicipality', registerLimiter);
app.use('/api/trpc/auth.registerGuardian', registerLimiter);
app.use('/api/trpc/auth.requestPasswordReset', registerLimiter);
app.use('/api/trpc', apiLimiter);

// ============================================
// HEALTH CHECK APRIMORADO
// ============================================
const startTime = Date.now();

app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  let dbLatency = 0;
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - start;
    dbStatus = 'connected';
  } catch { dbStatus = 'error'; }

  const mem = process.memoryUsage();
  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    version: '3.1.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
    },
    memory: {
      usedMB: Math.round(mem.heapUsed / 1024 / 1024),
      totalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    },
    node: process.version,
  });
});

// ============================================
// PDF GENERATION ENDPOINT (REST - binary response)
// ============================================
import { generatePDF, isPuppeteerAvailable } from './services/pdfService';
import { verify as jwtVerify } from 'jsonwebtoken';

app.post('/api/pdf/generate', async (req, res) => {
  try {
    // Authenticate
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Não autenticado' });
    try {
      const JWT = process.env.JWT_SECRET || '';
      jwtVerify(token, JWT);
    } catch { return res.status(401).json({ error: 'Token inválido' }); }

    const { html, orientation, filename } = req.body;
    if (!html) return res.status(400).json({ error: 'HTML é obrigatório' });

    const available = await isPuppeteerAvailable();
    if (!available) return res.status(503).json({ error: 'Serviço de PDF indisponível' });

    const pdfBuffer = await generatePDF(html, {
      orientation: orientation || 'portrait',
    });

    const safeName = (filename || 'documento').replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g, '_') + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (e: any) {
    console.error('Erro ao gerar PDF:', e.message);
    if (process.env.SENTRY_DSN) Sentry.captureException(e);
    res.status(500).json({ error: 'Erro ao gerar PDF: ' + (e.message || 'desconhecido') });
  }
});

app.get('/api/pdf/status', async (_req, res) => {
  const available = await isPuppeteerAvailable();
  res.json({ available, engine: 'puppeteer' });
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
// Catch-all: serve index.html ONLY for non-API routes (SPA routing)
app.get('*', (_req, res) => {
  // Never serve HTML for API routes
  if (_req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(finalFrontendPath, 'index.html'));
});

// ============================================
// ERROR HANDLER GLOBAL (Sentry + log)
// ============================================
app.use((err: any, _req: any, res: any, _next: any) => {
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  console.error('Erro não tratado:', err.message || err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Capturar erros não tratados do processo
process.on('unhandledRejection', (reason: any) => {
  console.error('Promessa não tratada:', reason);
  if (process.env.SENTRY_DSN) Sentry.captureException(reason);
});
process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
});

// ============================================
// START SERVER
// ============================================
const PORT = parseInt(process.env.PORT || '3000', 10);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NetEscol API v3.1.0 rodando na porta ${PORT}`);
  console.log(`📡 Socket.IO ativo`);
  console.log(`🌐 Frontend servido de: ${finalFrontendPath}`);
});
