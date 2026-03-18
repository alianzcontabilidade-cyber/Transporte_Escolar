"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = createContext;
const jsonwebtoken_1 = require("jsonwebtoken");
function createContext({ req, res }) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return { req, res };
    }
    try {
        const token = authorization.replace('Bearer ', '');
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || 'transescolar-secret-2024');
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
