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
import { sql, eq } from 'drizzle-orm';
import { generatePDF, isPuppeteerAvailable, generateVerificationCode, computePdfHash, generateQRCodeDataURL, injectQRCodeIntoHTML } from './services/pdfService';
import { verify as jwtVerify } from 'jsonwebtoken';
import { compare } from 'bcryptjs';
import { createHash } from 'crypto';
import { documents, documentSignatures, users } from './db/schema';

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
    // Domínios específicos do Railway (produção)
    if (origin.includes('endearing-radiance-production') || origin.includes('transporteescolar-production')) return callback(null, true);
    // Localhost para desenvolvimento e Capacitor (https://localhost)
    if (origin.startsWith('http://localhost') || origin.startsWith('https://localhost') || origin.startsWith('http://127.0.0.1') || origin === 'capacitor://localhost') return callback(null, true);
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

// Test endpoint
app.get('/api/test-seed', (_req, res) => { res.json({ ok: true, ts: Date.now() }); });

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
    if (!token) return res.status(401).json({ error: 'Não autenticado' });
    let tokenData: any;
    try {
      const JWT = process.env.JWT_SECRET || '';
      tokenData = jwtVerify(token, JWT) as any;
    } catch { return res.status(401).json({ error: 'Token inválido' }); }

    const { html, orientation, filename, docType, docTitle, studentId, schoolId, signAfterGenerate, signerPassword, signatures, skipSignatureBlock, systemAutoSignerId } = req.body;
    if (!html) return res.status(400).json({ error: 'HTML é obrigatório' });

    const pdfStatus = await isPuppeteerAvailable();
    if (!pdfStatus.available) return res.status(503).json({ error: 'Serviço de PDF indisponível: ' + (pdfStatus.error || 'desconhecido') });

    // Gerar código de verificação e QR Code
    const verificationCode = generateVerificationCode();
    const baseUrl = process.env.WEB_URL || process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'https://transporteescolar-production.up.railway.app';
    const verifyUrl = `${baseUrl}/verificar/${verificationCode}`;
    const qrDataURL = await generateQRCodeDataURL(verifyUrl);

    // Se signAfterGenerate, buscar dados do usuário logado e verificar senha ANTES de gerar PDF
    let autoSignUser: any = null;
    if (signAfterGenerate && signerPassword) {
      const [user] = await db.select({
        id: users.id, name: users.name, cpf: users.cpf, passwordHash: users.passwordHash,
        role: users.role, jobTitle: users.jobTitle, registrationNumber: users.registrationNumber,
        decree: users.decree, department: users.department,
      }).from(users).where(eq(users.id, tokenData.userId)).limit(1);
      if (!user || !user.passwordHash) return res.status(401).json({ error: 'Usuário não encontrado' });
      const isValid = await compare(signerPassword, user.passwordHash);
      if (!isValid) return res.status(401).json({ error: 'Senha incorreta' });
      autoSignUser = user;
    }

    // Assinatura automática pré-autorizada (sem senha - configurado pelo admin)
    if (systemAutoSignerId && !autoSignUser) {
      const [signer] = await db.select({
        id: users.id, name: users.name, cpf: users.cpf,
        role: users.role, jobTitle: users.jobTitle, registrationNumber: users.registrationNumber,
        decree: users.decree, department: users.department,
      }).from(users).where(eq(users.id, systemAutoSignerId)).limit(1);
      if (signer) autoSignUser = signer;
    }

    // Montar lista de assinantes (do request OU do usuário logado se signAfterGenerate)
    let allSigners: any[] = [];
    if (signatures && Array.isArray(signatures) && signatures.length > 0) {
      allSigners = signatures;
    }
    if (autoSignUser) {
      const roleMap: Record<string, string> = { super_admin: 'Administrador do Sistema', municipal_admin: 'Administrador Municipal', secretary: 'Secretário(a) de Educação', school_admin: 'Diretor(a) Escolar', teacher: 'Professor(a)', driver: 'Motorista', monitor: 'Monitor(a)' };
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
      const brOpts: Intl.DateTimeFormatOptions = { timeZone: 'America/Sao_Paulo' };
      const dateStr = now.toLocaleDateString('pt-BR', brOpts) + ' ' + now.toLocaleTimeString('pt-BR', { ...brOpts, hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const sigBlocksHtml = `
        <div style="page-break-inside:avoid;margin-top:30px;border:1px solid #ccc;border-radius:4px;font-family:Arial,sans-serif;">
          <div style="background:#f0f4f8;padding:8px 12px;border-bottom:1px solid #ccc;text-align:center;">
            <strong style="font-size:11px;color:#1B3A5C;">Assinaturas Eletr&ocirc;nicas</strong>
          </div>
          ${allSigners.map((s: any, i: number) => {
            const sigHash = verificationCode + '-' + (i+1);
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
      } else {
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
    const pdfBuffer = await generatePDF(htmlClean, {
      orientation: orientation || 'portrait',
      displayHeaderFooter: true,
      footerTemplate,
    });

    // Registrar documento no banco
    const pdfHash = computePdfHash(pdfBuffer);
    let documentId: number | null = null;
    try {
      const [inserted] = await db.insert(documents).values({
        municipalityId: tokenData.municipalityId || 1,
        verificationCode,
        type: docType || 'documento',
        title: docTitle || filename || 'Documento',
        studentId: studentId || null,
        schoolId: schoolId || null,
        generatedById: tokenData.userId || 1,
        pdfHash,
        pdfSize: pdfBuffer.length,
      } as any).$returningId();
      documentId = inserted.id;
    } catch (dbErr: any) {
      console.warn('Aviso: não foi possível registrar documento:', dbErr.message);
    }

    // Auto-sign after generation (senha já verificada acima)
    let signatureResult = null;
    if (autoSignUser && documentId) {
      try {
        const now = new Date();
        const signatureHash = createHash('sha256')
          .update(`${pdfHash}:${autoSignUser.id}:${now.toISOString()}`)
          .digest('hex');

        const roleMap: Record<string, string> = { super_admin: 'Administrador do Sistema', municipal_admin: 'Administrador Municipal', secretary: 'Secretário(a) de Educação', school_admin: 'Diretor(a) Escolar' };
        const [sigResult] = await db.insert(documentSignatures).values({
          documentId,
          signerId: autoSignUser.id,
          signerName: autoSignUser.name,
          signerRole: autoSignUser.jobTitle || roleMap[autoSignUser.role] || autoSignUser.role,
          signerCpf: autoSignUser.cpf || null,
          signatureHash,
          ipAddress: req.ip || req.socket.remoteAddress || null,
          signedAt: now,
        } as any).$returningId();

        signatureResult = {
          id: sigResult.id,
          signatureHash,
          signerName: autoSignUser.name,
          signedAt: now.toISOString(),
        };
      } catch (sigErr: any) {
        console.warn('Aviso: não foi possível assinar automaticamente:', sigErr.message);
      }
    }

    const safeName = (filename || 'documento').replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g, '_') + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Verification-Code', verificationCode);
    if (documentId) res.setHeader('X-Document-Id', String(documentId));
    if (signatureResult) res.setHeader('X-Signature-Hash', signatureResult.signatureHash);
    res.send(pdfBuffer);
  } catch (e: any) {
    console.error('Erro ao gerar PDF:', e.message);
    if (process.env.SENTRY_DSN) Sentry.captureException(e);
    res.status(500).json({ error: 'Erro ao gerar PDF: ' + (e.message || 'desconhecido') });
  }
});

// Verificação pública de documento (sem autenticação)
app.get('/api/documents/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const [doc] = await db.select({
      id: documents.id,
      verificationCode: documents.verificationCode,
      type: documents.type,
      title: documents.title,
      status: documents.status,
      generatedAt: documents.generatedAt,
      pdfHash: documents.pdfHash,
      pdfSize: documents.pdfSize,
    }).from(documents).where(sql`${documents.verificationCode} = ${code}`).limit(1);

    if (!doc) return res.json({ valid: false, message: 'Documento não encontrado' });

    // Buscar nome do gerador e município
    const { users: usersTable, municipalities } = await import('./db/schema');
    const [generator] = await db.select({ name: usersTable.name }).from(usersTable).where(sql`${usersTable.id} = (SELECT generatedById FROM documents WHERE verificationCode = ${code})`).limit(1);
    const [mun] = await db.select({ name: municipalities.name }).from(municipalities).where(sql`${municipalities.id} = (SELECT municipalityId FROM documents WHERE verificationCode = ${code})`).limit(1);

    // Buscar assinaturas eletrônicas do documento
    const sigs = await db.select({
      id: documentSignatures.id,
      signerName: documentSignatures.signerName,
      signerRole: documentSignatures.signerRole,
      signerCpf: documentSignatures.signerCpf,
      signatureHash: documentSignatures.signatureHash,
      signedAt: documentSignatures.signedAt,
    }).from(documentSignatures)
      .where(eq(documentSignatures.documentId, doc.id))
      .orderBy(documentSignatures.signedAt);

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
  } catch (e: any) {
    res.status(500).json({ valid: false, message: 'Erro ao verificar: ' + e.message });
  }
});

// Seed endpoint - dados acadêmicos de teste (SQL puro)
app.get('/api/seed-academic', async (_req, res) => {
  try {
    const log: string[] = [];
    const r = async (q: string) => { try { await (db as any).execute(sql.raw(q)); return true; } catch(e: any) { log.push('ERR: ' + e.message?.substring(0,80)); return false; } };

    await r(`INSERT IGNORE INTO academic_years (municipalityId, name, startDate, endDate, isCurrent) VALUES (1, '2026', '2026-02-03', '2026-12-20', true)`);
    const [[ay]] = await (db as any).execute(sql.raw(`SELECT id FROM academic_years WHERE municipalityId=1 ORDER BY id DESC LIMIT 1`)) as any;
    await r(`INSERT IGNORE INTO class_grades (municipalityId, name, level, orderIndex) VALUES (1, '8o Ano', 'fundamental2', 8)`);
    const [[cg]] = await (db as any).execute(sql.raw(`SELECT id FROM class_grades WHERE municipalityId=1 ORDER BY id DESC LIMIT 1`)) as any;
    log.push('ay=' + ay?.id + ' cg=' + cg?.id);
    for (const sid of [2, 3]) await r(`INSERT IGNORE INTO classes (municipalityId, schoolId, academicYearId, classGradeId, name, classShift) VALUES (1, ${sid}, ${ay?.id}, ${cg?.id}, 'A', 'morning')`);
    const [clsRows] = await (db as any).execute(sql.raw(`SELECT id, schoolId FROM classes WHERE municipalityId=1`)) as any;
    log.push(clsRows?.length + ' turmas');
    for (const n of ['Portugues','Matematica','Ciencias','Historia','Geografia','Ingles','Ed Fisica','Artes']) await r(`INSERT IGNORE INTO subjects (municipalityId, name) VALUES (1, '${n}')`);
    const [subjRows] = await (db as any).execute(sql.raw(`SELECT id FROM subjects WHERE municipalityId=1`)) as any;
    log.push(subjRows?.length + ' disciplinas');
    for (const c of (clsRows||[])) for (const s of (subjRows||[])) await r(`INSERT IGNORE INTO class_subjects (classId, subjectId) VALUES (${c.id}, ${s.id})`);
    for (const [sid, schId] of [[1,2],[2,3],[3,2]]) { const c = (clsRows||[]).find((x: any) => x.schoolId === schId); if (c) await r(`INSERT IGNORE INTO enrollments (studentId, classId, municipalityId, academicYearId, enrollmentStatus) VALUES (${sid}, ${c.id}, 1, ${ay?.id}, 'active')`); }
    log.push('matriculas ok');
    for (const c of (clsRows||[])) for (const s of (subjRows||[])) for (const b of ['1','2','3','4']) await r(`INSERT IGNORE INTO assessments (classId, subjectId, name, assessmentType, bimester, maxScore, weight, isActive, municipalityId) VALUES (${c.id}, ${s.id}, 'Prova ${b}Bim', 'prova', '${b}', 10, 1, true, 1)`);
    const [assRows] = await (db as any).execute(sql.raw(`SELECT id, classId FROM assessments WHERE municipalityId=1`)) as any;
    log.push(assRows?.length + ' avaliacoes');
    let gc = 0;
    for (const [sid, schId] of [[1,2],[2,3],[3,2]]) { const c = (clsRows||[]).find((x: any) => x.schoolId === schId); if (!c) continue; for (const a of (assRows||[]).filter((x: any) => x.classId === c.id)) { if (await r(`INSERT IGNORE INTO student_grades (studentId, assessmentId, score) VALUES (${sid}, ${a.id}, ${(6+Math.random()*4).toFixed(1)})`)) gc++; } }
    log.push(gc + ' notas');
    let ac = 0;
    for (const [sid, schId] of [[1,2],[2,3],[3,2]]) { const c = (clsRows||[]).find((x: any) => x.schoolId === schId); if (!c) continue; for (let i=1;i<=30;i++) { const d=new Date();d.setDate(d.getDate()-i); if(d.getDay()===0||d.getDay()===6)continue; const ds=d.toISOString().split('T')[0]; if(await r(`INSERT IGNORE INTO daily_attendance (studentId, classId, date, attendanceStatus) VALUES (${sid}, ${c.id}, '${ds}', '${Math.random()>0.1?'present':'absent'}')`)) ac++; } }
    log.push(ac + ' frequencia');

    res.json({ success: true, log });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/pdf/status', async (_req, res) => {
  const status = await isPuppeteerAvailable();
  res.json({ ...status, engine: 'puppeteer' });
});

// tRPC
app.use('/api/trpc', trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Socket.IO events
io.on('connection', (socket) => {
  // Socket conectado (sem log para reduzir ruído)

  socket.on('join:municipality', (municipalityId: number) => {
    socket.join(`municipality:${municipalityId}`);
  });

  // Chat: usuario entra na sala pessoal para receber mensagens diretas
  socket.on('join:user', (userId: number) => {
    socket.join(`user:${userId}`);
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
    // Socket desconectado
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
app.use(express.static(finalFrontendPath, { index: false }));
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
  console.log(`🚀 NetEscol API v4.0.0 | porta ${PORT} | Socket.IO ativo`);
});
