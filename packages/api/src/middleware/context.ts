import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET não definido em produção.');
  process.exit(1);
}

export interface Context {
  userId?: number;
  municipalityId?: number;
  role?: string;
  req: Request;
  res: Response;
}

export function createContext({ req, res }: { req: Request; res: Response }): Context {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return { req, res };
  }

  try {
    const token = authorization.replace('Bearer ', '');
    const decoded = verify(token, JWT_SECRET) as {
      userId: number;
      municipalityId: number;
      role: string;
    };
    
    return {
      req,
      res,
      userId: decoded.userId,
      municipalityId: decoded.municipalityId,
      role: decoded.role,
    };
  } catch {
    return { req, res };
  }
}
