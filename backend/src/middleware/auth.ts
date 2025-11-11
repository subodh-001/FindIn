import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { getCollection } from '../config/mongo';
import { UserDocument } from '../types';
import { ObjectId } from 'mongodb';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: UserDocument;
  file?: Express.Multer.File | undefined;
}

export const authenticate: RequestHandler = async (req, res, next): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    const payload = jwt.verify(token, secret) as { sub: string };
    authReq.userId = payload.sub;

    const usersCollection = getCollection<UserDocument>('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(payload.sub) });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    authReq.user = user;
    next();
    return;
  } catch (error) {
    console.error('[auth] token verification failed', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

