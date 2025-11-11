"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const zod_1 = require("zod");
const mongo_1 = require("../config/mongo");
const serializers_1 = require("../utils/serializers");
const router = (0, express_1.Router)();
const createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    location: zod_1.z.string().optional(),
    latitude: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    longitude: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    authorId: zod_1.z.string().min(1),
    reportId: zod_1.z.string().min(1),
});
router.post('/', async (req, res) => {
    try {
        const payload = createCommentSchema.parse(req.body);
        const usersCollection = (0, mongo_1.getCollection)('users');
        const reportsCollection = (0, mongo_1.getCollection)('reports');
        const commentsCollection = (0, mongo_1.getCollection)('comments');
        if (!mongodb_1.ObjectId.isValid(payload.authorId) || !mongodb_1.ObjectId.isValid(payload.reportId)) {
            return res.status(400).json({ error: 'Invalid author or report id' });
        }
        const author = await usersCollection.findOne({ _id: new mongodb_1.ObjectId(payload.authorId) });
        if (!author) {
            return res.status(404).json({ error: 'Author not found' });
        }
        if (!author.isVerified || author.verificationStatus !== 'APPROVED') {
            return res.status(403).json({ error: 'Author account not verified' });
        }
        const report = await reportsCollection.findOne({ _id: new mongodb_1.ObjectId(payload.reportId) });
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        const now = new Date();
        const comment = {
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
            comment: (0, serializers_1.serializeComment)(comment, author),
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.issues.map((issue) => issue.message).join(', ') });
        }
        console.error('[comments] create failed', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=comments.js.map