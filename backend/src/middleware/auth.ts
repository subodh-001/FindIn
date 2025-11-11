import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = header.slice(7);

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    const payload = jwt.verify(token, secret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch (error) {
    console.error('[auth] token verification failed', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

