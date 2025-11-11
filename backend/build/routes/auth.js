"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const mongo_1 = require("../config/mongo");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    pincode: zod_1.z.string().optional(),
    userType: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
function sanitizeUser(user) {
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
        const usersCollection = (0, mongo_1.getCollection)('users');
        const existing = await usersCollection.findOne({ email: payload.email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, error: 'User with this email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(payload.password, 10);
        const now = new Date();
        const userType = (payload.userType ?? 'CITIZEN').toUpperCase();
        const user = {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
        const usersCollection = (0, mongo_1.getCollection)('users');
        const user = await usersCollection.findOne({ email: payload.email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(payload.password, user.password);
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
        const sessionToken = jsonwebtoken_1.default.sign({ sub: user._id?.toString() ?? '' }, secret, { expiresIn: '7d' });
        return res.json({
            success: true,
            user: sanitizeUser(user),
            sessionToken,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ success: false, error: error.issues.map((issue) => issue.message).join(', ') });
        }
        console.error('[auth] login failed', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map