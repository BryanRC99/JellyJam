import { Request, Response, NextFunction } from 'express';
import { verifySession } from '../modules/auth/auth.service';
import { SessionPayload } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      session?: SessionPayload;
      rawToken?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : queryToken;

  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    req.session = verifySession(token);
    req.rawToken = token;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}