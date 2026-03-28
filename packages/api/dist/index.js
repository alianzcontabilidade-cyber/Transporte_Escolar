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
const bcryptjs_1 = require("bcryptjs");
const crypto_1 = require("crypto");
const schema_1 = require("./db/schema");
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
        // Domínios específicos do Railway (produção)
        if (origin.includes('endearing-radiance-production') || origin.includes('transporteescolar-production'))
            return callback(null, true);
        // Localhost para desenvolvimento e Capacitor (https://localhost)
        if (origin.startsWith('http://localhost') || origin.startsWith('https://localhost') || origin.startsWith('http://127.0.0.1') || origin === 'capacitor://localhost')
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
        version: '4.0.0',
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
        let tokenData;
        try {
            const JWT = process.env.JWT_SECRET || '';
            tokenData = (0, jsonwebtoken_1.verify)(token, JWT);
        }
        catch {
            return res.status(401).json({ error: 'Token inválido' });
        }
        const { html, orientation, filename, docType, docTitle, studentId, schoolId, signAfterGenerate, signerPassword, signatures, skipSignatureBlock, systemAutoSignerId } = req.body;
        if (!html)
            return res.status(400).json({ error: 'HTML é obrigatório' });
        const pdfStatus = await (0, pdfService_1.isPuppeteerAvailable)();
        if (!pdfStatus.available)
            return res.status(503).json({ error: 'Serviço de PDF indisponível: ' + (pdfStatus.error || 'desconhecido') });
        // Gerar código de verificação e QR Code
        const verificationCode = (0, pdfService_1.generateVerificationCode)();
        const baseUrl = process.env.WEB_URL || process.env.RAILWAY_PUBLIC_DOMAIN
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'https://transporteescolar-production.up.railway.app';
        const verifyUrl = `${baseUrl}/verificar/${verificationCode}`;
        const qrDataURL = await (0, pdfService_1.generateQRCodeDataURL)(verifyUrl);
        // Se signAfterGenerate, buscar dados do usuário logado e verificar senha ANTES de gerar PDF
        let autoSignUser = null;
        if (signAfterGenerate && signerPassword) {
            const [user] = await index_1.db.select({
                id: schema_1.users.id, name: schema_1.users.name, cpf: schema_1.users.cpf, passwordHash: schema_1.users.passwordHash,
                role: schema_1.users.role, jobTitle: schema_1.users.jobTitle, registrationNumber: schema_1.users.registrationNumber,
                decree: schema_1.users.decree, department: schema_1.users.department,
            }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, tokenData.userId)).limit(1);
            if (!user || !user.passwordHash)
                return res.status(401).json({ error: 'Usuário não encontrado' });
            const isValid = await (0, bcryptjs_1.compare)(signerPassword, user.passwordHash);
            if (!isValid)
                return res.status(401).json({ error: 'Senha incorreta' });
            autoSignUser = user;
        }
        // Assinatura automática pré-autorizada (sem senha - configurado pelo admin)
        if (systemAutoSignerId && !autoSignUser) {
            const [signer] = await index_1.db.select({
                id: schema_1.users.id, name: schema_1.users.name, cpf: schema_1.users.cpf,
                role: schema_1.users.role, jobTitle: schema_1.users.jobTitle, registrationNumber: schema_1.users.registrationNumber,
                decree: schema_1.users.decree, department: schema_1.users.department,
            }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, systemAutoSignerId)).limit(1);
            if (signer)
                autoSignUser = signer;
        }
        // Montar lista de assinantes (do request OU do usuário logado se signAfterGenerate)
        let allSigners = [];
        if (signatures && Array.isArray(signatures) && signatures.length > 0) {
            allSigners = signatures;
        }
        if (autoSignUser) {
            const roleMap = { super_admin: 'Administrador do Sistema', municipal_admin: 'Administrador Municipal', secretary: 'Secretário(a) de Educação', school_admin: 'Diretor(a) Escolar', teacher: 'Professor(a)', driver: 'Motorista', monitor: 'Monitor(a)' };
            allSigners.push({
                signerName: autoSignUser.name,
                signerRole: autoSignUser.jobTitle || roleMap[autoSignUser.role] || autoSignUser.role,
                signerCpf: autoSignUser.cpf,
                signerRegistration: autoSignUser.registrationNumber,
                signerDecree: autoSignUser.decree,
            });
        }
        let htmlClean = html;
        // PRIMEIRO: Extrair rodapé institucional ANTES de inserir assinaturas
        let footerContent = '';
        const footerMatch = htmlClean.match(/<div class="report-footer-bar">([\s\S]*?)<\/div>\s*<\/div>/);
        if (footerMatch) {
            footerContent = footerMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            htmlClean = htmlClean.replace(/<div class="report-footer-bar">[\s\S]*?<\/div>\s*<\/div>/, '');
        }
        // DEPOIS: Injetar bloco de assinatura eletrônica (pular se skipSignatureBlock - ex: carteirinhas com assinatura inline)
        if (allSigners.length > 0 && !skipSignatureBlock) {
            const now = new Date();
            const brOpts = { timeZone: 'America/Sao_Paulo' };
            const dateStr = now.toLocaleDateString('pt-BR', brOpts) + ' ' + now.toLocaleTimeString('pt-BR', { ...brOpts, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const sigBlocksHtml = `
        <div style="page-break-inside:avoid;margin-top:30px;border:1px solid #ccc;border-radius:4px;font-family:Arial,sans-serif;">
          <div style="background:#f0f4f8;padding:8px 12px;border-bottom:1px solid #ccc;text-align:center;">
            <strong style="font-size:11px;color:#1B3A5C;">Assinaturas Eletr&ocirc;nicas</strong>
          </div>
          ${allSigners.map((s, i) => {
                const sigHash = verificationCode + '-' + (i + 1);
                return `
            <div style="padding:10px 15px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:12px;">
              <img src="${qrDataURL}" style="width:45px;height:45px;flex-shrink:0;"/>
              <div style="flex:1;font-size:9px;line-height:1.5;color:#333;">
                <div>Documento assinado eletronicamente por <strong>${s.signerName || ''}</strong>, <strong>${s.signerRole || ''}</strong>${s.signerDecree ? ` (${s.signerDecree})` : ''}${s.signerRegistration ? `, Mat. ${s.signerRegistration}` : ''}, em ${dateStr}.</div>
                <div style="color:#666;margin-top:2px;">C&oacute;digo de verifica&ccedil;&atilde;o: <strong style="color:#1B3A5C;">${sigHash}</strong></div>
              </div>
            </div>`;
            }).join('')}
          <div style="padding:8px 15px;background:#f8f9fa;font-size:8px;color:#666;line-height:1.4;">
            A autenticidade deste documento pode ser conferida acessando <strong>${verifyUrl}</strong>, informando o c&oacute;digo verificador <strong>${verificationCode}</strong>. Assinatura eletr&ocirc;nica avan&ccedil;ada conforme Art. 4&ordm; da Lei n&ordm; 14.063/2020 e MP 2.200-2/2001.
          </div>
        </div>`;
            if (htmlClean.includes('</body>')) {
                htmlClean = htmlClean.replace('</body>', sigBlocksHtml + '</body>');
            }
            else {
                htmlClean += sigBlocksHtml;
            }
        }
        // Rodapé com QR Code + informações institucionais em TODAS as páginas
        const footerTemplate = `<div style="width:100%;font-size:7px;color:#555;padding:2px 12mm;border-top:1px solid #ccc;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:space-between;gap:8px">
      <div style="flex:1;text-align:center;line-height:1.3">
        <div>${footerContent || 'NetEscol - Sistema de Gestão Escolar Municipal'}</div>
        <div style="color:#999;font-size:6px;margin-top:1px">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <img src="${qrDataURL}" style="width:40px;height:40px"/>
        <div style="font-size:5px;color:#1B3A5C;font-weight:bold">${verificationCode}</div>
      </div>
    </div>`;
        // Gerar PDF com Puppeteer
        const pdfBuffer = await (0, pdfService_1.generatePDF)(htmlClean, {
            orientation: orientation || 'portrait',
            displayHeaderFooter: true,
            footerTemplate,
        });
        // Registrar documento no banco
        const pdfHash = (0, pdfService_1.computePdfHash)(pdfBuffer);
        let documentId = null;
        try {
            const [inserted] = await index_1.db.insert(schema_1.documents).values({
                municipalityId: tokenData.municipalityId || 1,
                verificationCode,
                type: docType || 'documento',
                title: docTitle || filename || 'Documento',
                studentId: studentId || null,
                schoolId: schoolId || null,
                generatedById: tokenData.userId || 1,
                pdfHash,
                pdfSize: pdfBuffer.length,
            }).$returningId();
            documentId = inserted.id;
        }
        catch (dbErr) {
            console.warn('Aviso: não foi possível registrar documento:', dbErr.message);
        }
        // Auto-sign after generation (senha já verificada acima)
        let signatureResult = null;
        if (autoSignUser && documentId) {
            try {
                const now = new Date();
                const signatureHash = (0, crypto_1.createHash)('sha256')
                    .update(`${pdfHash}:${autoSignUser.id}:${now.toISOString()}`)
                    .digest('hex');
                const roleMap = { super_admin: 'Administrador do Sistema', municipal_admin: 'Administrador Municipal', secretary: 'Secretário(a) de Educação', school_admin: 'Diretor(a) Escolar' };
                const [sigResult] = await index_1.db.insert(schema_1.documentSignatures).values({
                    documentId,
                    signerId: autoSignUser.id,
                    signerName: autoSignUser.name,
                    signerRole: autoSignUser.jobTitle || roleMap[autoSignUser.role] || autoSignUser.role,
                    signerCpf: autoSignUser.cpf || null,
                    signatureHash,
                    ipAddress: req.ip || req.socket.remoteAddress || null,
                    signedAt: now,
                }).$returningId();
                signatureResult = {
                    id: sigResult.id,
                    signatureHash,
                    signerName: autoSignUser.name,
                    signedAt: now.toISOString(),
                };
            }
            catch (sigErr) {
                console.warn('Aviso: não foi possível assinar automaticamente:', sigErr.message);
            }
        }
        const safeName = (filename || 'documento').replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g, '_') + '.pdf';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('X-Verification-Code', verificationCode);
        if (documentId)
            res.setHeader('X-Document-Id', String(documentId));
        if (signatureResult)
            res.setHeader('X-Signature-Hash', signatureResult.signatureHash);
        res.send(pdfBuffer);
    }
    catch (e) {
        console.error('Erro ao gerar PDF:', e.message);
        if (process.env.SENTRY_DSN)
            Sentry.captureException(e);
        res.status(500).json({ error: 'Erro ao gerar PDF: ' + (e.message || 'desconhecido') });
    }
});
// Verificação pública de documento (sem autenticação)
app.get('/api/documents/verify/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const [doc] = await index_1.db.select({
            id: schema_1.documents.id,
            verificationCode: schema_1.documents.verificationCode,
            type: schema_1.documents.type,
            title: schema_1.documents.title,
            status: schema_1.documents.status,
            generatedAt: schema_1.documents.generatedAt,
            pdfHash: schema_1.documents.pdfHash,
            pdfSize: schema_1.documents.pdfSize,
        }).from(schema_1.documents).where((0, drizzle_orm_1.sql) `${schema_1.documents.verificationCode} = ${code}`).limit(1);
        if (!doc)
            return res.json({ valid: false, message: 'Documento não encontrado' });
        // Buscar nome do gerador e município
        const { users: usersTable, municipalities } = await Promise.resolve().then(() => __importStar(require('./db/schema')));
        const [generator] = await index_1.db.select({ name: usersTable.name }).from(usersTable).where((0, drizzle_orm_1.sql) `${usersTable.id} = (SELECT generatedById FROM documents WHERE verificationCode = ${code})`).limit(1);
        const [mun] = await index_1.db.select({ name: municipalities.name }).from(municipalities).where((0, drizzle_orm_1.sql) `${municipalities.id} = (SELECT municipalityId FROM documents WHERE verificationCode = ${code})`).limit(1);
        // Buscar assinaturas eletrônicas do documento
        const sigs = await index_1.db.select({
            id: schema_1.documentSignatures.id,
            signerName: schema_1.documentSignatures.signerName,
            signerRole: schema_1.documentSignatures.signerRole,
            signerCpf: schema_1.documentSignatures.signerCpf,
            signatureHash: schema_1.documentSignatures.signatureHash,
            signedAt: schema_1.documentSignatures.signedAt,
        }).from(schema_1.documentSignatures)
            .where((0, drizzle_orm_1.eq)(schema_1.documentSignatures.documentId, doc.id))
            .orderBy(schema_1.documentSignatures.signedAt);
        res.json({
            valid: doc.status === 'valid',
            code: doc.verificationCode,
            type: doc.type,
            title: doc.title,
            status: doc.status,
            generatedAt: doc.generatedAt,
            generatedBy: generator?.name || 'Usuário do sistema',
            municipality: mun?.name || '',
            pdfHash: doc.pdfHash,
            pdfSize: doc.pdfSize,
            signatures: sigs.map(s => ({
                ...s,
                signerCpf: s.signerCpf ? s.signerCpf.replace(/(\d{3})\d{6}(\d{2})/, '$1.***.**$2') : null,
            })),
        });
    }
    catch (e) {
        res.status(500).json({ valid: false, message: 'Erro ao verificar: ' + e.message });
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
    // Socket conectado (sem log para reduzir ruído)
    socket.on('join:municipality', (municipalityId) => {
        socket.join(`municipality:${municipalityId}`);
    });
    // Chat: usuario entra na sala pessoal para receber mensagens diretas
    socket.on('join:user', (userId) => {
        socket.join(`user:${userId}`);
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
        // Socket desconectado
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
    console.log(`🚀 NetEscol API v4.0.0 | porta ${PORT} | Socket.IO ativo`);
});
