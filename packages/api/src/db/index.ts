import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não está definida!');
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

// Test connection with retry
async function testConnection(retries = 5, delay = 3000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await poolConnection.getConnection();
      console.log('✅ Banco de dados conectado!');
      conn.release();
      return;
    } catch (err: any) {
      console.error(`⚠️ Tentativa ${i + 1}/${retries}: ${err.message}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5;
      }
    }
  }
  console.error('❌ Falha ao conectar ao banco.');
  process.exit(1);
}

testConnection();

export const db = drizzle(poolConnection, { schema, mode: 'default' });
