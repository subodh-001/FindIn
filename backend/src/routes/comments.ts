import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getCollection } from '../config/mongo';
import { CommentDocument, ReportDocument, UserDocument } from '../types';
import { serializeComment } from '../utils/serializers';

const router = Router();

const createCommentSchema = z.object({
  content: z.string().min(1),
  location: z.string().optional(),
  latitude: z.union([z.number(), z.string()]).optional(),
  longitude: z.union([z.number(), z.string()]).optional(),
  authorId: z.string().min(1),
  reportId: z.string().min(1),
});

router.post('/', async (req, res) => {
  try {
    const payload = createCommentSchema.parse(req.body);

    const usersCollection = getCollection<UserDocument>('users');
    const reportsCollection = getCollection<ReportDocument>('reports');
    const commentsCollection = getCollection<CommentDocument>('comments');

    if (!ObjectId.isValid(payload.authorId) || !ObjectId.isValid(payload.reportId)) {
      return res.status(400).json({ error: 'Invalid author or report id' });
    }

    const author = await usersCollection.findOne({ _id: new ObjectId(payload.authorId) });

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    if (!author.isVerified || author.verificationStatus !== 'APPROVED') {
      return res.status(403).json({ error: 'Author account not verified' });
    }

    const report = await reportsCollection.findOne({ _id: new ObjectId(payload.reportId) });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const now = new Date();
    const comment: CommentDocument = {
      content: payload.content,
      location: payload.location ?? null,
      latitude: payload.latitude ? Number(payload.latitude) : null,
      longitude: payload.longitude ? Number(payload.longitude) : null,
      authorId: payload.authorId,
      reportId: payload.reportId,
      imagePath: null,
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await commentsCollection.insertOne(comment);
    comment._id = insertedId;

    return res.status(201).json({
      message: 'Comment created successfully',
      comment: serializeComment(comment, author),
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues.map((issue) => issue.message).join(', ') });
    }

    console.error('[comments] create failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

