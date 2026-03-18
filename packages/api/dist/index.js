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
// Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
});
// Compartilhar instância do Socket.IO com os routers
(0, socketInstance_1.setSocketIO)(io);
// CORS
app.use((0, cors_1.default)({ origin: '*', credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '2.1.0', timestamp: new Date().toISOString() });
});
// Endpoint temporário para diagnosticar e corrigir banco
app.get('/api/fix-db', async (_req, res) => {
    try {
        const { db } = require('./db/index');
        const { municipalities, users } = require('./db/schema');
        const { eq, sql } = require('drizzle-orm');
        const muns = await db.select({ id: municipalities.id, name: municipalities.name }).from(municipalities);
        const allUsers = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, municipalityId: users.municipalityId }).from(users);
        const result = { municipalities: muns, users: allUsers, actions: [] };
        if (muns.length === 0) {
            // Criar município padrão
            const [newMun] = await db.insert(municipalities).values({ name: 'Prefeitura Municipal', state: 'TO', city: 'Palmas' }).$returningId();
            result.actions.push('Municipio criado com ID: ' + newMun.id);
            // Corrigir todos os usuarios
            await db.execute(sql `UPDATE users SET municipalityId = ${newMun.id}`);
            result.actions.push('Todos os usuarios atualizados para municipalityId: ' + newMun.id);
        }
        else {
            const validIds = muns.map((m) => m.id);
            const invalidUsers = allUsers.filter((u) => !validIds.includes(u.municipalityId));
            if (invalidUsers.length > 0) {
                const targetMunId = muns[0].id;
                for (const u of invalidUsers) {
                    await db.execute(sql `UPDATE users SET municipalityId = ${targetMunId} WHERE id = ${u.id}`);
                }
                result.actions.push('Corrigidos ' + invalidUsers.length + ' usuarios para municipalityId: ' + targetMunId);
                result.invalidUsers = invalidUsers;
            }
            else {
                result.actions.push('Nenhum problema encontrado - todos os usuarios tem municipalityId valido');
            }
        }
        // Estado final
        const finalUsers = await db.select({ id: users.id, name: users.name, municipalityId: users.municipalityId }).from(users);
        result.finalState = finalUsers;
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
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
    console.log(`🚀 TransEscolar API rodando na porta ${PORT}`);
    console.log(`📡 Socket.IO ativo`);
    console.log(`🌐 Frontend servido de: ${finalFrontendPath}`);
});
