import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não está definida! Configure a variável de ambiente.');
  process.exit(1);
}

const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Testar conexão na inicialização com retry
async function testConnection(retries = 5, delay = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await poolConnection.getConnection();
      console.log('✅ Banco de dados conectado com sucesso!');
      conn.release();
      return;
    } catch (err: any) {
      console.error(`⚠️ Tentativa ${i + 1}/${retries} de conexão falhou: ${err.message}`);
      if (i < retries - 1) {
        console.log(`   Tentando novamente em ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // backoff exponencial
      }
    }
  }
  console.error('❌ Não foi possível conectar ao banco de dados após todas as tentativas.');
  console.error('   Verifique DATABASE_URL e se o MySQL está acessível.');
  process.exit(1);
}

// Executar teste de conexão (não bloqueia o import, mas loga erros)
testConnection();

// Monitorar erros do pool
poolConnection.on('connection', () => {
  console.log('🔄 Nova conexão MySQL estabelecida no pool');
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });
