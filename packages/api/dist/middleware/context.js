"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = createContext;
const jsonwebtoken_1 = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'netescol-dev-secret-2024');
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET must be set in production');
    process.exit(1);
}
function createContext({ req, res }) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return { req, res };
    }
    try {
        const token = authorization.replace('Bearer ', '');
        const decoded = (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
        return {
            req,
            res,
            userId: decoded.userId,
            municipalityId: decoded.municipalityId,
            role: decoded.role,
        };
    }
    catch {
        return { req, res };
    }
}
