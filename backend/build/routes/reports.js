"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const zod_1 = require("zod");
const mongo_1 = require("../config/mongo");
const serializers_1 = require("../utils/serializers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const createReportSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    location: zod_1.z.string().min(1),
    latitude: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).transform((value) => Number(value)),
    longitude: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).transform((value) => Number(value)),
    initialRadius: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().default(5),
    contactInfo: zod_1.z.string().min(1),
    emergencyContact: zod_1.z.string().optional(),
    authorId: zod_1.z.string().min(1),
    authorName: zod_1.z.string().optional(),
    authorType: zod_1.z.string().optional(),
    subCategory: zod_1.z.string().optional(),
    priority: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    pincode: zod_1.z.string().optional(),
    reward: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    lastSeen: zod_1.z.string().optional(),
    age: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    gender: zod_1.z.string().optional(),
    height: zod_1.z.string().optional(),
    build: zod_1.z.string().optional(),
    clothing: zod_1.z.string().optional(),
    specialMarks: zod_1.z.string().optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.string().min(1),
});
router.get('/', async (_req, res) => {
    try {
        const reportsCollection = (0, mongo_1.getCollection)('reports');
        const commentsCollection = (0, mongo_1.getCollection)('comments');
        const usersCollection = (0, mongo_1.getCollection)('users');
        const reports = await reportsCollection.find({}).sort({ createdAt: -1 }).toArray();
        if (!reports.length) {
            return res.json({ success: true, reports: [] });
        }
        const reportIds = reports.map((report) => report._id?.toString() ?? '');
        const commentCounts = await commentsCollection
            .aggregate([
            { $match: { reportId: { $in: reportIds } } },
            { $group: { _id: '$reportId', count: { $sum: 1 } } },
        ])
            .toArray();
        const countMap = new Map(commentCounts.map((item) => [item._id, item.count]));
        const authorIds = reports
            .map((report) => report.authorId)
            .filter((id) => id && mongodb_1.ObjectId.isValid(id));
        const authors = await usersCollection
            .find({ _id: { $in: authorIds.map((id) => new mongodb_1.ObjectId(id)) } })
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
                ...(0, serializers_1.serializeReport)(report, {
                    _count: {
                        comments: countMap.get(report._id?.toString() ?? '') ?? 0,
                        images: report.images?.length ?? 0,
                    },
                }),
                author: defaultAuthor,
            };
        });
        return res.json({ success: true, reports: serialized });
    }
    catch (error) {
        console.error('[reports] list failed', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.post('/', async (req, res) => {
    try {
        const payload = createReportSchema.parse(req.body);
        const reportsCollection = (0, mongo_1.getCollection)('reports');
        const usersCollection = (0, mongo_1.getCollection)('users');
        const now = new Date();
        const author = mongodb_1.ObjectId.isValid(payload.authorId)
            ? await usersCollection.findOne({ _id: new mongodb_1.ObjectId(payload.authorId) })
            : null;
        const report = {
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
        };
        const { insertedId } = await reportsCollection.insertOne(report);
        report._id = insertedId;
        return res.status(201).json({
            success: true,
            reportId: report._id,
            message: 'Report created successfully',
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
        const { id } = req.params;
        const reportsCollection = (0, mongo_1.getCollection)('reports');
        const commentsCollection = (0, mongo_1.getCollection)('comments');
        const usersCollection = (0, mongo_1.getCollection)('users');
        if (!mongodb_1.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid report id' });
        }
        const report = await reportsCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        const author = mongodb_1.ObjectId.isValid(report.authorId)
            ? await usersCollection.findOne({ _id: new mongodb_1.ObjectId(report.authorId) }, { projection: { firstName: 1, lastName: 1, userType: 1 } })
            : null;
        const comments = await commentsCollection
            .find({ reportId: id })
            .sort({ createdAt: -1 })
            .toArray();
        const commentAuthorIds = Array.from(new Set(comments.map((comment) => comment.authorId)));
        const validCommentAuthorIds = commentAuthorIds.filter((userId) => mongodb_1.ObjectId.isValid(userId));
        const commentAuthors = await usersCollection
            .find({ _id: { $in: validCommentAuthorIds.map((userId) => new mongodb_1.ObjectId(userId)) } })
            .project({ firstName: 1, lastName: 1 })
            .toArray();
        const commentAuthorMap = new Map(commentAuthors.map((user) => [
            user._id.toString(),
            {
                _id: user._id,
                firstName: user.firstName ?? '',
                lastName: user.lastName ?? '',
            },
        ]));
        return res.json({
            report: {
                ...(0, serializers_1.serializeReport)(report),
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
                comments: comments.map((comment) => (0, serializers_1.serializeComment)(comment, commentAuthorMap.get(comment.authorId ?? '') ?? null)),
            },
        });
    }
    catch (error) {
        console.error('[reports] detail failed', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const payload = updateStatusSchema.parse(req.body);
        const reportsCollection = (0, mongo_1.getCollection)('reports');
        const normalizedStatus = payload.status.toUpperCase();
        const now = new Date();
        const reportObjectId = new mongodb_1.ObjectId(id);
        const existingReport = await reportsCollection.findOne({ _id: reportObjectId });
        if (!existingReport) {
            return res.status(404).json({ error: 'Report not found' });
        }
        await reportsCollection.updateOne({ _id: reportObjectId }, {
            $set: {
                status: normalizedStatus,
                resolvedAt: normalizedStatus === 'RESOLVED' ? now : null,
                updatedAt: now,
            },
        });
        const updatedReport = await reportsCollection.findOne({ _id: reportObjectId });
        if (!updatedReport) {
            return res.status(404).json({ error: 'Report not found' });
        }
        return res.json({
            message: 'Report updated successfully',
            report: (0, serializers_1.serializeReport)(updatedReport),
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: error.issues.map((issue) => issue.message).join(', ') });
        }
        console.error('[reports] update failed', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map