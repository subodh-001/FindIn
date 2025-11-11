import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import sgMail from '@sendgrid/mail';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getCollection } from '../config/mongo';
import { InviteDocument, UserDocument, UserRole } from '../types';
import { serializeUser } from '../utils/serializers';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const router = Router();

function isAdmin(user?: UserDocument) {
  if (!user) return false;
  return user.userType === 'GOVERNMENT' || user.userType === 'POLICE';
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z
    .string()
    .transform((value) => value.toUpperCase() as UserRole)
    .refine((value) => ['POLICE', 'GOVERNMENT', 'NGO', 'MEDICAL', 'SECURITY'].includes(value), {
      message: 'Unsupported role for invite',
    }),
  expiresInDays: z.number().optional().default(7),
  message: z.string().optional(),
});

router.post('/', authenticate, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (!isAdmin(authReq.user)) {
      return res.status(403).json({ success: false, error: 'Only admins can create invites' });
    }

    const payload = inviteSchema.parse(req.body);
    const invitesCollection = getCollection<InviteDocument>('invites');

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + payload.expiresInDays * 24 * 60 * 60 * 1000);

    const invite: InviteDocument = {
      email: payload.email.toLowerCase(),
      role: payload.role,
      createdBy: authReq.user?._id?.toString() ?? '',
      expiresAt,
      redeemedAt: null,
      token,
      message: payload.message ?? null,
    };

    await invitesCollection.insertOne(invite);

    if (process.env.SENDGRID_FROM_EMAIL) {
      try {
        await sgMail.send({
          to: invite.email,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: 'FindIn responder invite',
          text: [
            `You have been invited to join FindIn as a verified responder (${invite.role}).`,
            `Use the following invite token when creating your account: ${token}`,
            `This token expires on ${invite.expiresAt.toDateString()}.`,
            payload.message ? `Message from admin: ${payload.message}` : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
        });
      } catch (error) {
        console.error('[invites] failed to send invite email', error);
      }
    }

    return res.json({
      success: true,
      token,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('[invites] create failed', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.issues.map((issue) => issue.message).join(', ') });
    }
    return res.status(500).json({ success: false, error: 'Failed to create invite' });
  }
});

const acceptSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

router.post('/accept', async (req, res) => {
  try {
    const payload = acceptSchema.parse(req.body);
    const invitesCollection = getCollection<InviteDocument>('invites');
    const usersCollection = getCollection<UserDocument>('users');

    const invite = await invitesCollection.findOne({ token: payload.token });

    if (!invite) {
      return res.status(404).json({ success: false, error: 'Invite not found' });
    }

    if (invite.redeemedAt) {
      return res.status(400).json({ success: false, error: 'Invite already redeemed' });
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, error: 'Invite has expired' });
    }

    if (invite.email.toLowerCase() !== payload.email.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Email does not match invite' });
    }

    const existingUser = await usersCollection.findOne({ email: payload.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const now = new Date();

    const user: UserDocument = {
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone ?? null,
      address: null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      pincode: null,
      userType: invite.role,
      isVerified: true,
      verificationStatus: 'APPROVED',
      verificationNotes: 'Joined via admin invite',
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

    const { insertedId } = await usersCollection.insertOne(user);
    user._id = insertedId;

    await invitesCollection.updateOne(
      { _id: invite._id },
      {
        $set: {
          redeemedAt: new Date(),
        },
      }
    );

    return res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    console.error('[invites] accept failed', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.issues.map((issue) => issue.message).join(', ') });
    }
    return res.status(500).json({ success: false, error: 'Failed to accept invite' });
  }
});

export default router;


