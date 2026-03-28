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
// Seed COMPLETO - todos os módulos
app.get('/api/seed-full', async (_req, res) => {
    try {
        const log = [];
        const r = async (q) => { try {
            await index_1.db.execute(drizzle_orm_1.sql.raw(q));
            return true;
        }
        catch (e) {
            log.push('ERR: ' + e.message?.substring(0, 60));
            return false;
        } };
        // ============ 1. CORRIGIR ALUNOS - nomes únicos, matrículas 2026XXX ============
        const alunosUpdate = [
            [1, 'Pedro Henrique Oliveira', 2, '5o Ano', 'A', 'morning', '2015-03-12', 'M', '12345678901', '1234567', 'Rua das Flores, 100, Centro'],
            [2, 'Ana Clara Souza', 2, '5o Ano', 'A', 'morning', '2015-07-21', 'F', '23456789012', '2345678', 'Av. Tocantins, 250, Setor Norte'],
            [3, 'Lucas Gabriel Costa', 3, '3o Ano', 'A', 'morning', '2017-01-15', 'M', '34567890123', '3456789', 'Rua Bahia, 45, Centro'],
            [4, 'Maria Eduarda Lima', 2, '3o Ano', 'B', 'afternoon', '2017-05-10', 'F', '45678901234', '4567890', 'Rua Goias, 78, Setor Sul'],
            [5, 'Joao Miguel Santos', 3, '4o Ano', 'A', 'morning', '2016-09-03', 'M', '56789012345', '5678901', 'Av. Principal, 320, Centro'],
            [7, 'Beatriz Silva Nunes', 2, '4o Ano', 'A', 'morning', '2016-02-28', 'F', '67890123456', '6789012', 'Rua Minas Gerais, 55, Setor Leste'],
            [8, 'Joao Pedro Ribeiro', 3, '2o Ano', 'A', 'morning', '2018-11-22', 'M', '78901234567', '7890123', 'Rua Piaui, 190, Centro'],
            [9, 'Larissa Ferreira Alves', 2, '1o Ano', 'A', 'morning', '2019-04-08', 'F', '89012345678', '8901234', 'Av. Brasil, 410, Setor Norte'],
            [10, 'Rafael Mendes Costa', 3, '5o Ano', 'A', 'afternoon', '2015-08-17', 'M', '90123456789', '9012345', 'Rua Maranhao, 33, Centro'],
            [11, 'Isabela Rodrigues Lima', 2, '2o Ano', 'A', 'morning', '2018-06-14', 'F', '01234567890', '0123456', 'Rua Para, 67, Setor Sul'],
            [12, 'Matheus Alves Pereira', 2, '4o Ano', 'B', 'afternoon', '2016-12-01', 'M', '11234567890', '1123456', 'Av. Tocantins, 88, Centro'],
            [13, 'Valentina Ferreira Santos', 3, '1o Ano', 'A', 'morning', '2019-10-25', 'F', '22345678901', '2234567', 'Rua Ceara, 12, Setor Leste'],
            [14, 'Gabriel Martins Pereira', 3, '3o Ano', 'A', 'afternoon', '2017-03-19', 'M', '33456789012', '3345678', 'Rua Amazonas, 145, Centro'],
            [15, 'Sofia Barbosa Nunes', 2, '5o Ano', 'B', 'afternoon', '2015-12-07', 'F', '44567890123', '4456789', 'Av. JK, 200, Setor Norte'],
            [16, 'Davi Santos Araujo', 2, '2o Ano', 'B', 'afternoon', '2018-02-11', 'M', '55678901234', '5567890', 'Rua Sergipe, 90, Centro'],
            [17, 'Helena Gomes Ribeiro', 3, '4o Ano', 'A', 'afternoon', '2016-07-30', 'F', '66789012345', '6678901', 'Rua Acre, 25, Setor Sul'],
            [18, 'Miguel Cardoso Dias', 3, '1o Ano', 'A', 'afternoon', '2019-09-05', 'M', '77890123456', '7789012', 'Av. Principal, 500, Centro'],
            [19, 'Laura Mendes Carvalho', 2, '3o Ano', 'A', 'afternoon', '2017-11-28', 'F', '88901234567', '8890123', 'Rua Tocantins, 73, Setor Leste'],
            [20, 'Arthur Moreira Castro', 2, '5o Ano', 'A', 'afternoon', '2015-05-20', 'M', '99012345678', '9901234', 'Rua Parana, 160, Centro'],
            [21, 'Manuela Teixeira Lopes', 3, '2o Ano', 'A', 'afternoon', '2018-08-03', 'F', '10123456789', '1012345', 'Rua Mato Grosso, 42, Setor Norte'],
            [22, 'Bernardo Pinto Silva', 3, '4o Ano', 'B', 'afternoon', '2016-04-15', 'M', '21234567890', '2123456', 'Av. Goias, 310, Centro'],
            [23, 'Alice Rocha Fernandes', 2, '1o Ano', 'B', 'afternoon', '2019-01-12', 'F', '32345678901', '3234567', 'Rua Bahia, 88, Setor Sul'],
            [24, 'Theo Lima Azevedo', 2, '3o Ano', 'B', 'afternoon', '2017-07-09', 'M', '43456789012', '4345678', 'Av. Brasil, 550, Centro'],
            [25, 'Cecilia Campos Vieira', 3, '5o Ano', 'A', 'morning', '2015-10-31', 'F', '54567890123', '5456789', 'Rua Pernambuco, 15, Setor Leste'],
            [26, 'Enzo Freitas Monteiro', 2, '2o Ano', 'A', 'afternoon', '2018-03-26', 'M', '65678901234', '6567890', 'Rua Alagoas, 77, Centro'],
        ];
        for (const a of alunosUpdate) {
            const [id, name, schoolId, grade, classRoom, shift, birth, sex, cpf, rg, addr] = a;
            const mat = '2026' + String(id).padStart(3, '0');
            await r(`UPDATE students SET name='${name}', schoolId=${schoolId}, grade='${grade}', classRoom='${classRoom}', shift='${shift}', birthDate='${birth}', sex='${sex}', cpf='${cpf}', rg='${rg}', address='${addr}', enrollment='${mat}', city='Fatima', state='TO', nationality='Brasileira', zone='urbana' WHERE id=${id}`);
        }
        log.push('25 alunos atualizados com matriculas 2026XXX');
        // Filiação - pai e mãe para cada aluno
        const filiacoes = [
            [1, 'Roberto Oliveira', '11111111111', 'Sandra Henrique Oliveira', '11111111112'],
            [2, 'Carlos Souza', '22222222221', 'Fernanda Clara Souza', '22222222222'],
            [3, 'Marcos Costa', '22222222221', 'Fernanda Clara Souza', '22222222222'],
            [4, 'Antonio Lima', '33333333331', 'Juliana Eduarda Lima', '33333333332'],
            [5, 'Francisco Santos', '33333333331', 'Juliana Eduarda Lima', '33333333332'],
            [7, 'Paulo Nunes', '44444444441', 'Adriana Silva Nunes', '44444444442'],
            [8, 'Paulo Nunes', '44444444441', 'Adriana Silva Nunes', '44444444442'],
            [9, 'Paulo Nunes', '44444444441', 'Adriana Silva Nunes', '44444444442'],
            [10, 'Marcos Costa', '55555555551', 'Patricia Mendes Costa', '55555555552'],
            [11, 'Jose Rodrigues', '55555555551', 'Patricia Mendes Costa', '55555555552'],
            [12, 'Ricardo Alves', '66666666661', 'Camila Alves Pereira', '66666666662'],
            [13, 'Ricardo Alves', '66666666661', 'Camila Alves Pereira', '66666666662'],
            [14, 'Andre Martins', '77777777771', 'Luciana Martins Pereira', '77777777772'],
            [15, 'Andre Martins', '77777777771', 'Luciana Martins Pereira', '77777777772'],
            [16, 'Jose Santos', '88888888881', 'Maria Santos Araujo', '88888888882'],
            [17, 'Jose Santos', '88888888881', 'Maria Santos Araujo', '88888888882'],
            [18, 'Eduardo Cardoso', '99999999991', 'Ana Cardoso Dias', '99999999992'],
            [19, 'Fabio Mendes', '10101010101', 'Claudia Mendes Carvalho', '10101010102'],
            [20, 'Fabio Mendes', '10101010101', 'Claudia Mendes Carvalho', '10101010102'],
            [21, 'Fabio Mendes', '10101010101', 'Claudia Mendes Carvalho', '10101010102'],
            [22, 'Sergio Pinto', '20202020201', 'Renata Pinto Silva', '20202020202'],
            [23, 'Fernando Rocha', '30303030301', 'Eliana Rocha Fernandes', '30303030302'],
            [24, 'Fernando Rocha', '30303030301', 'Eliana Rocha Fernandes', '30303030302'],
            [25, 'Rodrigo Campos', '40404040401', 'Tatiana Campos Vieira', '40404040402'],
            [26, 'Luis Freitas', '50505050501', 'Daniela Freitas Monteiro', '50505050502'],
        ];
        for (const f of filiacoes) {
            const [id, pn, pc, mn, mc] = f;
            await r(`UPDATE students SET fatherName='${pn}', fatherCpf='${pc}', motherName='${mn}', motherCpf='${mc}' WHERE id=${id}`);
        }
        log.push('Filiacoes atualizadas');
        // ============ 2. VINCULAR PAIS AOS ALUNOS ============
        // pai@teste.com (userId=33) → alunos 1, 2, 3
        // jose.pai@email.com (userId=27) → alunos 4, 5, 8
        // alianzontabilidade@gmail.com (userId=30) → alunos 7, 11, 17
        const guardianLinks = [
            [33, 1, 'pai'], [33, 2, 'pai'], [33, 3, 'pai'],
            [27, 4, 'pai'], [27, 5, 'pai'], [27, 8, 'pai'],
            [30, 7, 'mae'], [30, 11, 'mae'], [30, 17, 'mae'],
        ];
        for (const [uid, sid, rel] of guardianLinks) {
            await r(`INSERT IGNORE INTO guardians (userId, studentId, municipalityId, relationship, isPrimary) VALUES (${uid}, ${sid}, 1, '${rel}', true)`);
        }
        log.push('Guardians vinculados');
        // ============ 3. SERIES ============
        const series = ['1o Ano', '2o Ano', '3o Ano', '4o Ano', '5o Ano'];
        for (let i = 0; i < series.length; i++) {
            await r(`INSERT IGNORE INTO class_grades (municipalityId, name, orderIndex) VALUES (1, '${series[i]}', ${i + 1})`);
        }
        log.push('Series criadas');
        // ============ 4. TURMAS ============
        const [[ayRow]] = await index_1.db.execute(drizzle_orm_1.sql.raw(`SELECT id FROM academic_years WHERE municipalityId=1 LIMIT 1`));
        const ayId = ayRow?.id || 1;
        const [cgRows] = await index_1.db.execute(drizzle_orm_1.sql.raw(`SELECT id, name FROM class_grades WHERE municipalityId=1`));
        for (const schId of [2, 3]) {
            for (const cg of (cgRows || [])) {
                for (const turma of ['A', 'B']) {
                    await r(`INSERT IGNORE INTO classes (municipalityId, schoolId, academicYearId, classGradeId, name, classShift) VALUES (1, ${schId}, ${ayId}, ${cg.id}, '${turma}', '${turma === 'A' ? 'morning' : 'afternoon'}')`);
                }
            }
        }
        const [allClasses] = await index_1.db.execute(drizzle_orm_1.sql.raw(`SELECT c.id, c.schoolId, c.name as turma, c.classShift as shift, cg.name as grade FROM classes c JOIN class_grades cg ON c.classGradeId=cg.id WHERE c.municipalityId=1`));
        log.push((allClasses?.length || 0) + ' turmas');
        // ============ 5. DISCIPLINAS ============
        const disciplinas = ['Lingua Portuguesa', 'Matematica', 'Ciencias', 'Historia', 'Geografia', 'Ingles', 'Educacao Fisica', 'Artes'];
        for (const n of disciplinas)
            await r(`INSERT IGNORE INTO subjects (municipalityId, name) VALUES (1, '${n}')`);
        const [allSubjects] = await index_1.db.execute(drizzle_orm_1.sql.raw(`SELECT id FROM subjects WHERE municipalityId=1`));
        log.push((allSubjects?.length || 0) + ' disciplinas');
        // Vincular disciplinas a turmas
        for (const c of (allClasses || []))
            for (const s of (allSubjects || []))
                await r(`INSERT IGNORE INTO class_subjects (classId, subjectId) VALUES (${c.id}, ${s.id})`);
        // ============ 6. MATRICULAS ============
        // Limpar matriculas antigas
        await r(`DELETE FROM enrollments WHERE municipalityId=1`);
        for (const a of alunosUpdate) {
            const [sid, , schId, grade, turma, shift] = a;
            const cls = (allClasses || []).find((c) => c.schoolId === schId && c.grade === grade && c.turma === turma);
            if (cls) {
                await r(`INSERT IGNORE INTO enrollments (studentId, classId, municipalityId, academicYearId, enrollmentStatus) VALUES (${sid}, ${cls.id}, 1, ${ayId}, 'active')`);
            }
        }
        log.push('Matriculas vinculadas');
        // ============ 7. AVALIACOES + NOTAS ============
        await r(`DELETE FROM student_grades WHERE 1=1`);
        await r(`DELETE FROM assessments WHERE municipalityId=1`);
        for (const c of (allClasses || [])) {
            for (const s of (allSubjects || [])) {
                for (const b of ['1', '2', '3', '4']) {
                    await r(`INSERT INTO assessments (classId, subjectId, name, assessmentType, bimester, maxScore, weight, isActive, municipalityId) VALUES (${c.id}, ${s.id}, 'Prova ${b} Bim', 'prova', '${b}', 10, 1, true, 1)`);
                }
            }
        }
        const [allAss] = await index_1.db.execute(drizzle_orm_1.sql.raw(`SELECT id, classId FROM assessments WHERE municipalityId=1`));
        log.push((allAss?.length || 0) + ' avaliacoes');
        // Notas para cada aluno na sua turma
        let notasCount = 0;
        for (const a of alunosUpdate) {
            const [sid, , schId, grade, turma] = a;
            const cls = (allClasses || []).find((c) => c.schoolId === schId && c.grade === grade && c.turma === turma);
            if (!cls)
                continue;
            const classAss = (allAss || []).filter((x) => x.classId === cls.id);
            for (const ass of classAss) {
                const score = (5.5 + Math.random() * 4.5).toFixed(1);
                if (await r(`INSERT IGNORE INTO student_grades (studentId, assessmentId, score) VALUES (${sid}, ${ass.id}, ${score})`))
                    notasCount++;
            }
        }
        log.push(notasCount + ' notas');
        // ============ 8. FREQUENCIA ============
        await r(`DELETE FROM daily_attendance WHERE 1=1`);
        let freqCount = 0;
        for (const a of alunosUpdate) {
            const [sid, , schId, grade, turma] = a;
            const cls = (allClasses || []).find((c) => c.schoolId === schId && c.grade === grade && c.turma === turma);
            if (!cls)
                continue;
            for (let i = 1; i <= 40; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                if (d.getDay() === 0 || d.getDay() === 6)
                    continue;
                const ds = d.toISOString().split('T')[0];
                const st = Math.random() > 0.08 ? 'present' : 'absent';
                if (await r(`INSERT IGNORE INTO daily_attendance (studentId, classId, date, attendanceStatus) VALUES (${sid}, ${cls.id}, '${ds}', '${st}')`))
                    freqCount++;
            }
        }
        log.push(freqCount + ' frequencia');
        // ============ 9. CALENDARIO ============
        const feriados = [
            ['2026-01-01', 'Confraternizacao Universal'], ['2026-02-16', 'Carnaval'], ['2026-02-17', 'Carnaval'],
            ['2026-04-03', 'Sexta-feira Santa'], ['2026-04-21', 'Tiradentes'], ['2026-05-01', 'Dia do Trabalho'],
            ['2026-06-04', 'Corpus Christi'], ['2026-09-07', 'Independencia'], ['2026-10-05', 'Aniversario de Fatima'],
            ['2026-10-12', 'Nossa Sra Aparecida'], ['2026-11-02', 'Finados'], ['2026-11-15', 'Proclamacao da Republica'],
            ['2026-12-25', 'Natal'],
        ];
        for (const [dt, name] of feriados) {
            await r(`INSERT IGNORE INTO school_calendar (municipalityId, title, startDate, eventType, color) VALUES (1, '${name}', '${dt}', 'feriado', '#ef4444')`);
        }
        const eventos = [
            ['2026-02-03', 'Inicio do Ano Letivo', 'evento'], ['2026-03-14', 'Reuniao de Pais 1 Bim', 'reuniao'],
            ['2026-04-13', 'Conselho de Classe 1 Bim', 'conselho'], ['2026-04-14', 'Entrega de Boletins', 'evento'],
            ['2026-05-15', 'Formacao de Professores', 'formacao'], ['2026-06-15', 'Festa Junina', 'evento'],
            ['2026-07-01', 'Inicio do Recesso', 'recesso'], ['2026-07-17', 'Fim do Recesso', 'recesso'],
            ['2026-08-11', 'Dia do Estudante', 'evento'], ['2026-09-21', 'Reuniao de Pais 3 Bim', 'reuniao'],
            ['2026-10-15', 'Dia do Professor', 'evento'], ['2026-11-20', 'Conselho de Classe Final', 'conselho'],
            ['2026-12-18', 'Encerramento do Ano Letivo', 'evento'],
        ];
        for (const [dt, name, tp] of eventos) {
            const colors = { evento: '#059669', reuniao: '#1E40AF', conselho: '#7C3AED', formacao: '#ec4899', recesso: '#3b82f6' };
            await r(`INSERT IGNORE INTO school_calendar (municipalityId, title, startDate, eventType, color) VALUES (1, '${name}', '${dt}', '${tp}', '${colors[tp] || '#64748b'}')`);
        }
        log.push('Calendario preenchido');
        // ============ 10. OCORRENCIAS ============
        await r(`INSERT IGNORE INTO student_occurrences (municipalityId, studentId, occurrenceType, title, description, severity, occurrenceDate, registeredById) VALUES (1, 16, 'disciplinar', 'Conversa excessiva em sala', 'Aluno foi advertido verbalmente por conversar durante a explicacao', 'low', '2026-03-10', 1)`);
        await r(`INSERT IGNORE INTO student_occurrences (municipalityId, studentId, occurrenceType, title, description, severity, occurrenceDate, registeredById) VALUES (1, 3, 'pedagogica', 'Dificuldade em Matematica', 'Aluno apresentou dificuldade na prova do 1 bimestre. Encaminhado para reforco', 'medium', '2026-03-15', 1)`);
        await r(`INSERT IGNORE INTO student_occurrences (municipalityId, studentId, occurrenceType, title, description, severity, occurrenceDate, registeredById) VALUES (1, 12, 'elogio', 'Destaque em Ciencias', 'Aluno se destacou na feira de ciencias com projeto sobre energia solar', 'low', '2026-03-20', 1)`);
        log.push('Ocorrencias inseridas');
        // ============ 11. MERENDA ============
        const merendas = [
            ['Segunda', 'Arroz, feijao, frango grelhado, salada, suco de manga'],
            ['Terca', 'Macarrao ao molho, carne moida, salada de alface, suco de goiaba'],
            ['Quarta', 'Arroz, feijao, peixe assado, legumes, suco de acerola'],
            ['Quinta', 'Sopa de legumes com macarrao, pao, suco de caju'],
            ['Sexta', 'Arroz, feijao, carne de panela, pure de batata, suco de laranja'],
        ];
        for (const [dia, desc] of merendas) {
            await r(`INSERT IGNORE INTO meal_menus (municipalityId, date, mealType, description) VALUES (1, '2026-03-${dia === 'Segunda' ? '24' : dia === 'Terca' ? '25' : dia === 'Quarta' ? '26' : dia === 'Quinta' ? '27' : '28'}', 'almoco', '${dia}: ${desc}')`);
        }
        log.push('Merenda cadastrada');
        res.json({ success: true, log });
    }
    catch (e) {
        res.status(500).json({ error: e.message, stack: e.stack?.substring(0, 300) });
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
