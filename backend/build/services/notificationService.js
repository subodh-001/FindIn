"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyRadiusExpansion = notifyRadiusExpansion;
const mongo_1 = require("../config/mongo");
async function notifyRadiusExpansion(report, newRadius) {
    const notificationsCollection = (0, mongo_1.getCollection)('notifications');
    const usersCollection = (0, mongo_1.getCollection)('users');
    const users = await usersCollection
        .find({
        isVerified: true,
        verificationStatus: 'APPROVED',
    })
        .project({ _id: 1 })
        .toArray();
    if (!users.length) {
        return;
    }
    const now = new Date();
    const notifications = users.map((user) => ({
        type: 'RADIUS_EXPANDED',
        title: 'Search Radius Expanded',
        message: `Search radius for "${report.title}" expanded to ${newRadius} km`,
        userId: user._id?.toString() ?? null,
        reportId: report._id?.toString() ?? null,
        isRead: false,
        createdAt: now,
        updatedAt: now,
    }));
    await notificationsCollection.insertMany(notifications);
}
//# sourceMappingURL=notificationService.js.map