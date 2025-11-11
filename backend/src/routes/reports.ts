import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getCollection } from '../config/mongo';
import {
  CommentDocument,
  ReportDocument,
  UserDocument,
  AuditLogDocument,
  AbuseReportDocument,
} from '../types';
import { serializeComment, serializeReport, serializeUser } from '../utils/serializers';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { notifyReportCreated } from '../services/notificationService';

const router = Router();

const createReportSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  location: z.string().min(1),
  latitude: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  longitude: z.union([z.number(), z.string()]).transform((value) => Number(value)),
  initialRadius: z.union([z.number(), z.string()]).optional().default(5),
  contactInfo: z.string().min(1),
  emergencyContact: z.string().optional(),
  authorId: z.string().min(1),
  authorName: z.string().optional(),
  authorType: z.string().optional(),
  subCategory: z.string().optional(),
  priority: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  reward: z.union([z.number(), z.string()]).optional(),
  lastSeen: z.string().optional(),
  age: z.union([z.number(), z.string()]).optional(),
  gender: z.string().optional(),
  height: z.string().optional(),
  build: z.string().optional(),
  clothing: z.string().optional(),
  specialMarks: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1),
});

router.get('/', async (_req, res) => {
  try {
    const reportsCollection = getCollection<ReportDocument>('reports');
    const commentsCollection = getCollection<CommentDocument>('comments');
    const usersCollection = getCollection<UserDocument>('users');

    const reports = await reportsCollection.find({}).sort({ createdAt: -1 }).toArray();

    if (!reports.length) {
      return res.json({ success: true, reports: [] });
    }

    const reportIds = reports.map((report) => report._id?.toString() ?? '');

    const commentCounts = await commentsCollection
      .aggregate<{ _id: string; count: number }>([
        { $match: { reportId: { $in: reportIds } } },
        { $group: { _id: '$reportId', count: { $sum: 1 } } },
      ])
      .toArray();

    const countMap = new Map(commentCounts.map((item) => [item._id, item.count]));

    const authorIds = reports
      .map((report) => report.authorId)
      .filter((id) => id && ObjectId.isValid(id)) as string[];
    const authors = await usersCollection
      .find({ _id: { $in: authorIds.map((id) => new ObjectId(id)) } })
      .project({ firstName: 1, lastName: 1, userType: 1, city: 1, state: 1 })
      .toArray();

    const authorMap = new Map(authors.map((author) => [author._id?.toString() ?? '', author]));

    const serialized = reports.map((report) => {
      const authorDoc = authorMap.get(report.authorId);
      const defaultAuthor = authorDoc
        ? {
            firstName: authorDoc.firstName,
            lastName: authorDoc.lastName,
            userType: authorDoc.userType,
            city: authorDoc.city,
            state: authorDoc.state,
          }
        : {
            firstName: report.authorName,
            lastName: '',
            userType: report.authorType,
            city: report.city,
            state: report.state,
          };

      return {
        ...serializeReport(report, {
          _count: {
            comments: countMap.get(report._id?.toString() ?? '') ?? 0,
            images: report.images?.length ?? 0,
          },
        }),
        author: defaultAuthor,
      };
    });

    return res.json({ success: true, reports: serialized });
  } catch (error) {
    console.error('[reports] list failed', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = createReportSchema.parse(req.body);
    const reportsCollection = getCollection<ReportDocument>('reports');
    const usersCollection = getCollection<UserDocument>('users');

    const now = new Date();
    const author =
      ObjectId.isValid(payload.authorId)
        ? await usersCollection.findOne({ _id: new ObjectId(payload.authorId) })
        : null;

    const report: ReportDocument = {
      title: payload.title,
      description: payload.description,
      category: payload.category.toUpperCase(),
      subCategory: payload.subCategory ?? null,
      priority: payload.priority ?? 'MEDIUM',
      status: 'ACTIVE',
      location: payload.location,
      city: payload.city ?? null,
      state: payload.state ?? null,
      pincode: payload.pincode ?? null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      initialRadius: Number(payload.initialRadius) || 5,
      currentRadius: Number(payload.initialRadius) || 5,
      contactInfo: payload.contactInfo,
      emergencyContact: payload.emergencyContact ?? null,
      reward: payload.reward ? String(payload.reward) : null,
      lastSeen: payload.lastSeen ? new Date(payload.lastSeen) : null,
      age: typeof payload.age === 'number' ? payload.age : payload.age ? Number(payload.age) : null,
      gender: payload.gender ?? null,
      height: payload.height ?? null,
      build: payload.build ?? null,
      clothing: payload.clothing ?? null,
      specialMarks: payload.specialMarks ?? null,
      authorId: payload.authorId,
      authorName: author ? `${author.firstName} ${author.lastName}`.trim() : payload.authorName ?? '',
      authorType: author ? author.userType : payload.authorType ?? 'CITIZEN',
      images: [],
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      lastRadiusExpand: now,
      radiusHistory: [
        {
          radius: Number(payload.initialRadius) || 5,
          expandedAt: now,
          expandedBy: 'SYSTEM',
          reason: 'Initial radius',
        },
      ],
    };

    const { insertedId } = await reportsCollection.insertOne(report);
    report._id = insertedId;

    await notifyReportCreated(report);

    return res.status(201).json({
      success: true,
      reportId: report._id,
      message: 'Report created successfully',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, error: error.issues.map((issue) => issue.message).join(', ') });
    }
    console.error('[reports] create failed', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const reportsCollection = getCollection<ReportDocument>('reports');
    const commentsCollection = getCollection<CommentDocument>('comments');
    const usersCollection = getCollection<UserDocument>('users');

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid report id' });
    }

    const report = await reportsCollection.findOne({ _id: new ObjectId(id) });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const author =
      ObjectId.isValid(report.authorId)
        ? await usersCollection.findOne(
            { _id: new ObjectId(report.authorId) },
            { projection: { firstName: 1, lastName: 1, userType: 1 } }
          )
        : null;

    const comments = await commentsCollection
      .find({ reportId: id })
      .sort({ createdAt: -1 })
      .toArray();

    const commentAuthorIds = Array.from(new Set(comments.map((comment) => comment.authorId)));
    const validCommentAuthorIds = commentAuthorIds.filter((userId) => ObjectId.isValid(userId));
    const commentAuthors = await usersCollection
      .find({ _id: { $in: validCommentAuthorIds.map((userId) => new ObjectId(userId)) } })
      .project<{ _id: ObjectId; firstName?: string; lastName?: string }>({ firstName: 1, lastName: 1 })
      .toArray();

    const commentAuthorMap = new Map(
      commentAuthors.map((user) => [
        user._id.toString(),
        {
          _id: user._id,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
        },
      ])
    );

    return res.json({
      report: {
        ...serializeReport(report),
        author: author
          ? {
              id: author._id?.toString(),
              firstName: author.firstName,
              lastName: author.lastName,
              userType: author.userType,
            }
          : {
              id: report.authorId,
              firstName: report.authorName,
              lastName: '',
              userType: report.authorType,
            },
        comments: comments.map((comment) =>
          serializeComment(comment, commentAuthorMap.get(comment.authorId ?? '') ?? null)
        ),
      },
    });
  } catch (error) {
    console.error('[reports] detail failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id as string;
    const payload = updateStatusSchema.parse(req.body);
    const reportsCollection = getCollection<ReportDocument>('reports');

    const normalizedStatus = payload.status.toUpperCase() as ReportDocument['status'];
    const now = new Date();

    const reportObjectId = new ObjectId(id);
    const existingReport = await reportsCollection.findOne({ _id: reportObjectId });

    if (!existingReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await reportsCollection.updateOne(
      { _id: reportObjectId },
      {
        $set: {
          status: normalizedStatus,
          resolvedAt: normalizedStatus === 'RESOLVED' ? now : null,
          updatedAt: now,
        },
      }
    );

    const updatedReport = await reportsCollection.findOne({ _id: reportObjectId });

    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.json({
      message: 'Report updated successfully',
      report: serializeReport(updatedReport),
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: error.issues.map((issue) => issue.message).join(', ') });
    }
    console.error('[reports] update failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const abuseSchema = z.object({
  reason: z.string().min(1),
  details: z.string().optional(),
});

router.post('/:id/abuse', authenticate, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const idParam = req.params.id;
    if (typeof idParam !== 'string' || !ObjectId.isValid(idParam)) {
      return res.status(400).json({ success: false, error: 'Invalid report id' });
    }
    const id = idParam;

    if (!authReq.userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const reporterId = authReq.userId as string;
    const payload = abuseSchema.parse(req.body);
    const reportsCollection = getCollection<ReportDocument>('reports');
    const report = await reportsCollection.findOne({ _id: new ObjectId(id) });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const abusesCollection = getCollection<AbuseReportDocument>('report_abuse');
    const now = new Date();

    const abuseEntry: AbuseReportDocument = {
      reportId: id,
      reporterId,
      reason: payload.reason,
      details: payload.details ?? null,
      status: 'OPEN',
      createdAt: now,
    };

    await abusesCollection.insertOne(abuseEntry);

    const auditCollection = getCollection<AuditLogDocument>('audit_logs');
    await auditCollection.insertOne({
      actorId: reporterId,
      action: 'REPORT_ABUSE',
      entityType: 'REPORT',
      entityId: id ?? null,
      metadata: {
        reason: payload.reason,
        details: payload.details ?? null,
      },
      createdAt: now,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('[reports] abuse report failed', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.issues.map((issue) => issue.message).join(', ') });
    }
    return res.status(500).json({ success: false, error: 'Failed to submit abuse report' });
  }
});

export default router;

