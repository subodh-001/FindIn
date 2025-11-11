import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getCollection } from '../config/mongo';
import { UserDocument, UserRole } from '../types';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import speakeasy from 'speakeasy';
import { ObjectId } from 'mongodb';

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
  twoFactorCode: z.string().optional(),
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
      verificationNotes: null,
      idDocumentId: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      preferredChannels: {
        sms: true,
        email: true,
        push: true,
      },
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

    if (user.twoFactorEnabled) {
      if (!payload.twoFactorCode) {
        return res
          .status(401)
          .json({ success: false, error: 'Two-factor code required', requiresTwoFactor: true });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret ?? '',
        encoding: 'base32',
        token: payload.twoFactorCode,
        window: 1,
      });

      if (!verified) {
        return res.status(401).json({ success: false, error: 'Invalid two-factor code' });
      }
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

router.post('/two-factor/setup', authenticate, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (authReq.user?.userType !== 'GOVERNMENT' && authReq.user?.userType !== 'POLICE') {
      return res.status(403).json({ success: false, error: 'Only admins can enable two-factor auth' });
    }

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userId = authReq.userId as string;
    const usersCollection = getCollection<UserDocument>('users');
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `FindIn (${authReq.user?.email})`,
    });

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          twoFactorSecret: secret.base32,
          updatedAt: new Date(),
        },
      }
    );

    return res.json({
      success: true,
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    });
  } catch (error) {
    console.error('[auth] two-factor setup failed', error);
    return res.status(500).json({ success: false, error: 'Failed to start two-factor setup' });
  }
});

const verifyTwoFactorSchema = z.object({
  token: z.string().min(6).max(6),
});

router.post('/two-factor/verify', authenticate, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (authReq.user?.userType !== 'GOVERNMENT' && authReq.user?.userType !== 'POLICE') {
      return res.status(403).json({ success: false, error: 'Only admins can enable two-factor auth' });
    }

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userId = authReq.userId as string;
    const payload = verifyTwoFactorSchema.parse(req.body);
    const usersCollection = getCollection<UserDocument>('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user?.twoFactorSecret) {
      return res.status(400).json({ success: false, error: 'Two-factor secret not initialized' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: payload.token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          twoFactorEnabled: true,
          updatedAt: new Date(),
        },
      }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('[auth] two-factor verify failed', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.issues[0]?.message ?? 'Invalid input' });
    }
    return res.status(500).json({ success: false, error: 'Failed to verify two-factor token' });
  }
});

router.post('/two-factor/disable', authenticate, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (authReq.user?.userType !== 'GOVERNMENT' && authReq.user?.userType !== 'POLICE') {
      return res.status(403).json({ success: false, error: 'Only admins can manage two-factor auth' });
    }

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userId = authReq.userId as string;
    const usersCollection = getCollection<UserDocument>('users');
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          updatedAt: new Date(),
        },
      }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('[auth] two-factor disable failed', error);
    return res.status(500).json({ success: false, error: 'Failed to disable two-factor auth' });
  }
});

export default router;

