import { Router } from 'express';
import multer from 'multer';
import { Readable } from 'node:stream';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getBucket, getCollection } from '../config/mongo';
import { AuditLogDocument, UserDocument, VerificationStatus } from '../types';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
});

function isAdmin(user?: UserDocument) {
  if (!user) return false;
  return user.userType === 'GOVERNMENT' || user.userType === 'POLICE';
}

async function appendAuditLog(entry: Omit<AuditLogDocument, '_id' | 'createdAt'>) {
  const auditCollection = getCollection<AuditLogDocument>('audit_logs');
  await auditCollection.insertOne({
    ...entry,
    entityId: entry.entityId ?? null,
    createdAt: new Date(),
  });
}

router.post(
  '/users/:userId/document',
  authenticate,
  upload.single('document'),
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const userId = req.params.userId as string;
      const currentUser = authReq.user;

      if (!authReq.file) {
        return res.status(400).json({ success: false, error: 'Document file is required' });
      }

      if (!currentUser || !authReq.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const isSelf = currentUser._id?.toString() === userId;
      if (!isSelf && !isAdmin(currentUser)) {
        return res.status(403).json({ success: false, error: 'Not allowed to upload documents for this user' });
      }

      const actorId = authReq.userId as string;
      const usersCollection = getCollection<UserDocument>('users');
      const userObjectId = new ObjectId(userId);
      const user = await usersCollection.findOne({ _id: userObjectId });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const bucket = getBucket();

      if (user.idDocumentId) {
        try {
          await bucket.delete(user.idDocumentId);
        } catch (error) {
          console.warn('[verification] failed to delete previous document', error);
        }
      }

      const uploadStream = bucket.openUploadStream(
        `id-proof-${userId}-${Date.now()}-${authReq.file.originalname.replace(/\s+/g, '-')}`,
        {
          metadata: {
            uploadedBy: currentUser._id?.toString(),
            mimeType: authReq.file.mimetype,
            size: authReq.file.size,
            originalName: authReq.file.originalname,
          },
        }
      );

      const readable = Readable.from(authReq.file.buffer);
      await new Promise<void>((resolve, reject) => {
        readable
          .pipe(uploadStream)
          .on('finish', () => resolve())
          .on('error', (error) => reject(error));
      });

      await usersCollection.updateOne(
        { _id: userObjectId },
        {
          $set: {
            idDocumentId: uploadStream.id as ObjectId,
            verificationStatus: 'PENDING' as VerificationStatus,
            verificationNotes: isSelf ? user.verificationNotes ?? null : user.verificationNotes ?? null,
            updatedAt: new Date(),
          },
        }
      );

      await appendAuditLog({
        actorId,
        action: 'UPLOAD_VERIFICATION_DOCUMENT',
        entityType: 'USER',
        entityId: userId ?? null,
        metadata: {
          filename: authReq.file.originalname,
          size: authReq.file.size,
          mimeType: authReq.file.mimetype,
        },
      });

      return res.json({ success: true, documentId: uploadStream.id.toString() });
    } catch (error) {
      console.error('[verification] document upload failed', error);
      return res.status(500).json({ success: false, error: 'Failed to upload verification document' });
    }
  }
);

router.get('/queue', authenticate, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const currentUser = authReq.user;

  if (!isAdmin(currentUser)) {
    return res.status(403).json({ success: false, error: 'Only admins can view the queue' });
  }

  const usersCollection = getCollection<UserDocument>('users');
  const pending = await usersCollection
    .find({ verificationStatus: 'PENDING' })
    .project({
      firstName: 1,
      lastName: 1,
      email: 1,
      phone: 1,
      city: 1,
      state: 1,
      userType: 1,
      idDocumentId: 1,
      verificationNotes: 1,
      createdAt: 1,
    })
    .toArray();

  const queue = pending.map((item) => ({
    id: item._id?.toString() ?? '',
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    phone: item.phone,
    city: item.city,
    state: item.state,
    userType: item.userType,
    documentId: item.idDocumentId ? item.idDocumentId.toString() : null,
    notes: item.verificationNotes ?? null,
    submittedAt: item.createdAt,
  }));

  return res.json({ success: true, queue });
});

router.get('/documents/:documentId', authenticate, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const currentUser = authReq.user;

  if (!isAdmin(currentUser)) {
    return res.status(403).json({ success: false, error: 'Only admins can view documents' });
  }

  const documentId = req.params.documentId as string;

  if (!ObjectId.isValid(documentId)) {
    return res.status(400).json({ success: false, error: 'Invalid document id' });
  }

  try {
    const bucket = getBucket();
    const downloadStream = bucket.openDownloadStream(new ObjectId(documentId));

    downloadStream.on('error', (error) => {
      console.error('[verification] download failed', error);
      if (!res.headersSent) {
        res.status(404).json({ success: false, error: 'Document not found' });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('[verification] failed to read document', error);
    return res.status(500).json({ success: false, error: 'Failed to read document' });
  }
});

const decisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});

router.post('/:userId/decision', authenticate, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const currentUser = authReq.user;
    if (!isAdmin(currentUser)) {
      return res.status(403).json({ success: false, error: 'Only admins can review users' });
    }

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userId = req.params.userId as string;
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const payload = decisionSchema.parse(req.body);
    const actorId = authReq.userId as string;
    const usersCollection = getCollection<UserDocument>('users');

    const update: Partial<UserDocument> = {
      verificationStatus: payload.status,
      verificationNotes: payload.notes ?? null,
      updatedAt: new Date(),
    };

    if (payload.status === 'APPROVED') {
      update.isVerified = true;
    } else {
      update.isVerified = false;
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: update,
      }
    );

    await appendAuditLog({
      actorId,
      action: 'REVIEW_VERIFICATION',
      entityType: 'USER',
      entityId: userId ?? null,
      metadata: {
        status: payload.status,
        notes: payload.notes ?? null,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('[verification] decision failed', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.issues.map((issue) => issue.message).join(', ') });
    }
    return res.status(500).json({ success: false, error: 'Failed to update verification status' });
  }
});

export default router;


