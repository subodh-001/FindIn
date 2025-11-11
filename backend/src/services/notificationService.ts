import { getCollection } from '../config/mongo';
import { NotificationDocument, ReportDocument, UserDocument } from '../types';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { ObjectId } from 'mongodb';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN ?? '';
const twilioFromNumber = process.env.TWILIO_FROM_NUMBER ?? '';

const sendgridApiKey = process.env.SENDGRID_API_KEY ?? '';
const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL ?? '';

const twilioClient =
  twilioAccountSid && twilioAuthToken ? twilio(twilioAccountSid, twilioAuthToken) : null;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

async function dispatchChannels(user: UserDocument | null, notification: NotificationDocument) {
  if (!user) {
    return;
  }

  const channels = user.preferredChannels ?? { sms: true, email: true, push: true };

  if (channels.sms && twilioClient && user.phone && twilioFromNumber) {
    try {
      await twilioClient.messages.create({
        to: user.phone,
        from: twilioFromNumber,
        body: `${notification.title}: ${notification.message}`,
      });
    } catch (error) {
      console.error('[notifications] failed to send SMS', error);
    }
  }

  if (channels.email && sendgridApiKey && sendgridFromEmail && user.email) {
    try {
      await sgMail.send({
        to: user.email,
        from: sendgridFromEmail,
        subject: notification.title,
        text: notification.message,
      });
    } catch (error) {
      console.error('[notifications] failed to send email', error);
    }
  }
}

export async function saveNotification(notification: NotificationDocument) {
  const notificationsCollection = getCollection<NotificationDocument>('notifications');
  await notificationsCollection.insertOne(notification);

  if (notification.userId) {
    const usersCollection = getCollection<UserDocument>('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(notification.userId) });
    await dispatchChannels(user ?? null, notification);
  }
}

export async function notifyRadiusExpansion(report: ReportDocument, newRadius: number) {
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

  await Promise.all(
    users.map(async (user) => {
      const notification: NotificationDocument = {
        type: 'RADIUS_EXPANDED',
        title: 'Search Radius Expanded',
        message: `Search radius for "${report.title}" expanded to ${newRadius} km`,
        userId: user._id?.toString() ?? null,
        reportId: report._id?.toString() ?? null,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      };

      await saveNotification(notification);
    })
  );
}

export async function notifyReportCreated(report: ReportDocument) {
  const usersCollection = getCollection<UserDocument>('users');
  const responders = await usersCollection
    .find({
      isVerified: true,
      verificationStatus: 'APPROVED',
      userType: { $in: ['POLICE', 'NGO', 'MEDICAL', 'GOVERNMENT'] },
    })
    .project({ _id: 1 })
    .toArray();

  const now = new Date();

  await Promise.all(
    responders.map(async (user) => {
      const notification: NotificationDocument = {
        type: 'REPORT_CREATED',
        title: `New ${report.category} report`,
        message: `${report.title} needs immediate review.`,
        userId: user._id?.toString() ?? null,
        reportId: report._id?.toString() ?? null,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      };

      await saveNotification(notification);
    })
  );
}

