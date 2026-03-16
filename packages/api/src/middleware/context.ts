import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

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
    const decoded = verify(token, process.env.JWT_SECRET || 'transescolar-secret-2024') as {
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
