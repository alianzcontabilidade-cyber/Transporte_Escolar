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
exports.db = void 0;
const mysql2_1 = require("drizzle-orm/mysql2");
const promise_1 = __importDefault(require("mysql2/promise"));
const schema = __importStar(require("./schema"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não está definida!');
    process.exit(1);
}
const poolConnection = promise_1.default.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});
// Test connection with retry
async function testConnection(retries = 5, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            const conn = await poolConnection.getConnection();
            console.log('✅ Banco de dados conectado!');
            conn.release();
            return;
        }
        catch (err) {
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
exports.db = (0, mysql2_1.drizzle)(poolConnection, { schema, mode: 'default' });
