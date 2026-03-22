"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sentry = __importStar(require("@sentry/node"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const trpcExpress = __importStar(require("@trpc/server/adapters/express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv = __importStar(require("dotenv"));
const routers_1 = require("./routers");
const context_1 = require("./middleware/context");
const socketInstance_1 = require("./socketInstance");
const index_1 = require("./db/index");
const drizzle_orm_1 = require("drizzle-orm");
const pdfService_1 = require("./services/pdfService");
const jsonwebtoken_1 = require("jsonwebtoken");
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
            if (event.message?.includes('rate limit') || event.message?.includes('CORS'))
                return null;
            return event;
        },
    });
    console.log('📊 Sentry ativo - monitoramento de erros habilitado');
}
else {
    console.log('📊 Sentry não configurado (defina SENTRY_DSN para ativar)');
}
// ============================================
// EXPRESS + TRPC + SOCKET.IO SERVER
// ============================================
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// CORS whitelist - allow same-origin (frontend served by same server) + configured origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(o => o.trim());
const corsOptions = {
    origin: function (origin, callback) {
        // Sem origin = mesma origem (frontend servido pelo mesmo servidor), mobile apps, curl
        if (!origin)
            return callback(null, true);
        // Origens configuradas via variável de ambiente
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))
            return callback(null, true);
        // Domínio do Railway (produção)
        if (process.env.RAILWAY_PUBLIC_DOMAIN && origin.includes(process.env.RAILWAY_PUBLIC_DOMAIN))
            return callback(null, true);
        // Subdomínios do Railway (*.railway.app)
        if (origin.endsWith('.railway.app') || origin.endsWith('.up.railway.app'))
            return callback(null, true);
        // Localhost para desenvolvimento
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
            return callback(null, true);
        // Bloquear origens desconhecidas
        console.warn(`CORS bloqueado para origem: ${origin}`);
        callback(new Error('Origem não permitida pelo CORS'));
    },
    credentials: true,
};
// Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: corsOptions.origin, methods: ['GET', 'POST'], credentials: true },
    transports: ['websocket', 'polling'],
});
// Compartilhar instância do Socket.IO com os routers
(0, socketInstance_1.setSocketIO)(io);
// CORS
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
// Test route (primeira rota registrada)
app.get('/api/ping', (_req, res) => { res.json({ pong: true, ts: Date.now() }); });
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
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
});
// Rate limit para registro: 3 tentativas / hora por IP
const registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: 'Limite de cadastros atingido. Tente novamente em 1 hora.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
});
// Rate limit geral da API: 200 requisições / min por IP
const apiLimiter = (0, express_rate_limit_1.default)({
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
        await index_1.db.execute((0, drizzle_orm_1.sql) `SELECT 1`);
        dbLatency = Date.now() - start;
        dbStatus = 'connected';
    }
    catch {
        dbStatus = 'error';
    }
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
app.post('/api/pdf/generate', async (req, res) => {
    try {
        // Authenticate
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).json({ error: 'Não autenticado' });
        try {
            const JWT = process.env.JWT_SECRET || '';
            (0, jsonwebtoken_1.verify)(token, JWT);
        }
        catch {
            return res.status(401).json({ error: 'Token inválido' });
        }
        const { html, orientation, filename } = req.body;
        if (!html)
            return res.status(400).json({ error: 'HTML é obrigatório' });
        const pdfStatus = await (0, pdfService_1.isPuppeteerAvailable)();
        if (!pdfStatus.available)
            return res.status(503).json({ error: 'Serviço de PDF indisponível: ' + (pdfStatus.error || 'desconhecido') });
        const pdfBuffer = await (0, pdfService_1.generatePDF)(html, {
            orientation: orientation || 'portrait',
        });
        const safeName = (filename || 'documento').replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g, '_') + '.pdf';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    }
    catch (e) {
        console.error('Erro ao gerar PDF:', e.message);
        if (process.env.SENTRY_DSN)
            Sentry.captureException(e);
        res.status(500).json({ error: 'Erro ao gerar PDF: ' + (e.message || 'desconhecido') });
    }
});
app.get('/api/pdf/status', async (_req, res) => {
    const status = await (0, pdfService_1.isPuppeteerAvailable)();
    res.json({ ...status, engine: 'puppeteer' });
});
// tRPC
app.use('/api/trpc', trpcExpress.createExpressMiddleware({
    router: routers_1.appRouter,
    createContext: context_1.createContext,
}));
// Socket.IO events
io.on('connection', (socket) => {
    console.log('🔌 Socket conectado:', socket.id);
    socket.on('join:municipality', (municipalityId) => {
        socket.join(`municipality:${municipalityId}`);
    });
    // Manter compatibilidade com emissões diretas do cliente
    socket.on('bus:location', (data) => {
        if (data.municipalityId) {
            socket.to(`municipality:${data.municipalityId}`).emit('bus:location', data);
        }
    });
    socket.on('stop:arrived', (data) => {
        if (data.municipalityId) {
            io.to(`municipality:${data.municipalityId}`).emit('stop:arrived', data);
        }
    });
    socket.on('student:boarded', (data) => {
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
const frontendPath = path_1.default.resolve(__dirname, '../public/index.html')
    ? path_1.default.resolve(__dirname, '../public')
    : path_1.default.resolve(__dirname, '../../apps/web/dist');
// Fallback: tentar ambos os caminhos
const fs = require('fs');
const finalFrontendPath = fs.existsSync(path_1.default.resolve(__dirname, '../public/index.html'))
    ? path_1.default.resolve(__dirname, '../public')
    : path_1.default.resolve(__dirname, '../../apps/web/dist');
app.use(express_1.default.static(finalFrontendPath, { index: false }));
// Catch-all: serve index.html ONLY for non-API routes (SPA routing)
app.get('*', (_req, res) => {
    // Never serve HTML for API routes
    if (_req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path_1.default.join(finalFrontendPath, 'index.html'));
});
// ============================================
// ERROR HANDLER GLOBAL (Sentry + log)
// ============================================
app.use((err, _req, res, _next) => {
    if (process.env.SENTRY_DSN)
        Sentry.captureException(err);
    console.error('Erro não tratado:', err.message || err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});
// Capturar erros não tratados do processo
process.on('unhandledRejection', (reason) => {
    console.error('Promessa não tratada:', reason);
    if (process.env.SENTRY_DSN)
        Sentry.captureException(reason);
});
process.on('uncaughtException', (err) => {
    console.error('Exceção não capturada:', err);
    if (process.env.SENTRY_DSN)
        Sentry.captureException(err);
});
// ============================================
// START SERVER
// ============================================
const PORT = parseInt(process.env.PORT || '3000', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NetEscol API v3.1.0 rodando na porta ${PORT}`);
    console.log(`📡 Socket.IO ativo`);
    console.log(`🌐 Frontend servido de: ${finalFrontendPath}`);
    console.log(`🖨️ PDF endpoint: /api/pdf/generate`);
    console.log(`❤️ Health: /api/health`);
});
