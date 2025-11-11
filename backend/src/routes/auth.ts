import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getCollection } from '../config/mongo';
import { UserDocument, UserRole } from '../types';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  userType: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function sanitizeUser(user: UserDocument) {
  const { password, ...rest } = user;
  return {
    ...rest,
    _id: user._id?.toString(),
    id: user._id?.toString(),
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  };
}

router.post('/register', async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const usersCollection = getCollection<UserDocument>('users');

    const existing = await usersCollection.findOne({ email: payload.email.toLowerCase() });

    if (existing) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const now = new Date();
    const userType = (payload.userType ?? 'CITIZEN').toUpperCase() as UserRole;

    const user: UserDocument = {
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      pincode: payload.pincode ?? null,
      userType,
      isVerified: false,
      verificationStatus: 'PENDING',
      idDocumentPath: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await usersCollection.insertOne(user);
    user._id = result.insertedId;

    return res.status(201).json({ success: true, user: sanitizeUser(user) });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, error: error.issues.map((issue) => issue.message).join(', ') });
    }

    console.error('[auth] register failed', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const usersCollection = getCollection<UserDocument>('users');

    const user = await usersCollection.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(payload.password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.verificationStatus !== 'APPROVED') {
      return res.status(403).json({ success: false, error: 'Your account is pending admin approval' });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    const sessionToken = jwt.sign({ sub: user._id?.toString() ?? '' }, secret, { expiresIn: '7d' });

    return res.json({
      success: true,
      user: sanitizeUser(user),
      sessionToken,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, error: error.issues.map((issue) => issue.message).join(', ') });
    }

    console.error('[auth] login failed', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

