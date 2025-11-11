import { getCollection } from '../config/mongo';
import { NotificationDocument, ReportDocument, UserDocument } from '../types';

export async function notifyRadiusExpansion(report: ReportDocument, newRadius: number) {
  const notificationsCollection = getCollection<NotificationDocument>('notifications');
  const usersCollection = getCollection<UserDocument>('users');

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
  const notifications: NotificationDocument[] = users.map((user) => ({
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

