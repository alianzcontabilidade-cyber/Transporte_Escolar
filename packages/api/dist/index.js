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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const trpcExpress = __importStar(require("@trpc/server/adapters/express"));
const path_1 = __importDefault(require("path"));
const dotenv = __importStar(require("dotenv"));
const routers_1 = require("./routers");
const context_1 = require("./middleware/context");
const socketInstance_1 = require("./socketInstance");
dotenv.config();
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
        // Allow requests with no origin (same-origin, mobile apps, curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))
            return callback(null, true);
        // In production, allow same domain
        if (process.env.RAILWAY_PUBLIC_DOMAIN && origin.includes(process.env.RAILWAY_PUBLIC_DOMAIN))
            return callback(null, true);
        // Allow any railway.app domain
        if (origin.includes('.railway.app') || origin.includes('.up.railway.app'))
            return callback(null, true);
        callback(null, true); // Allow all for now - tighten in production
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
app.use(express_1.default.static(finalFrontendPath));
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(finalFrontendPath, 'index.html'));
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
