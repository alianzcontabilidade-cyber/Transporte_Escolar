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

// Socket.IO
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

// Compartilhar instância do Socket.IO com os routers
setSocketIO(io);

// CORS
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint temporário para diagnosticar e corrigir banco
app.get('/api/fix-db', async (_req, res) => {
  try {
    const { db } = require('./db/index');
    const { municipalities, users } = require('./db/schema');
    const { eq, sql } = require('drizzle-orm');

    const muns = await db.select({ id: municipalities.id, name: municipalities.name }).from(municipalities);
    const allUsers = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, municipalityId: users.municipalityId }).from(users);

    const result: any = { municipalities: muns, users: allUsers, actions: [] };

    if (muns.length === 0) {
      // Criar município padrão
      const [newMun] = await db.insert(municipalities).values({ name: 'Prefeitura Municipal', state: 'TO', city: 'Palmas' }).$returningId();
      result.actions.push('Municipio criado com ID: ' + newMun.id);

      // Corrigir todos os usuarios
      await db.execute(sql`UPDATE users SET municipalityId = ${newMun.id}`);
      result.actions.push('Todos os usuarios atualizados para municipalityId: ' + newMun.id);
    } else {
      const validIds = muns.map((m: any) => m.id);
      const invalidUsers = allUsers.filter((u: any) => !validIds.includes(u.municipalityId));

      if (invalidUsers.length > 0) {
        const targetMunId = muns[0].id;
        for (const u of invalidUsers) {
          await db.execute(sql`UPDATE users SET municipalityId = ${targetMunId} WHERE id = ${u.id}`);
        }
        result.actions.push('Corrigidos ' + invalidUsers.length + ' usuarios para municipalityId: ' + targetMunId);
        result.invalidUsers = invalidUsers;
      } else {
        result.actions.push('Nenhum problema encontrado - todos os usuarios tem municipalityId valido');
      }
    }

    // Estado final
    const finalUsers = await db.select({ id: users.id, name: users.name, municipalityId: users.municipalityId }).from(users);
    result.finalState = finalUsers;

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
  console.log(`🚀 TransEscolar API rodando na porta ${PORT}`);
  console.log(`📡 Socket.IO ativo`);
  console.log(`🌐 Frontend servido de: ${finalFrontendPath}`);
});
