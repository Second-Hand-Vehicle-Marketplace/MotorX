import type { Types } from 'mongoose';
import { AuthUserModel } from '../auth-users/authUser.model.js';
import { NotificationModel, type Notification, type NotificationDocument } from './notification.model.js';

// Creates a notification, marking the email leg 'pending' only when the email channel applies.
export function createNotification(input: Pick<Notification, 'userId' | 'type' | 'title' | 'message' | 'channels' | 'details'>): Promise<NotificationDocument> {
  return NotificationModel.create({ ...input, emailStatus: input.channels.includes('email') ? 'pending' : 'not_applicable' });
}

export function setNotificationEmailStatus(notificationId: Types.ObjectId, emailStatus: Notification['emailStatus']) {
  return NotificationModel.updateOne({ _id: notificationId }, { $set: { emailStatus } });
}

export async function listNotificationsForUser(userId: Types.ObjectId, page: number, limit: number) {
  const [documents, total] = await Promise.all([
    NotificationModel.find({ userId }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    NotificationModel.countDocuments({ userId }),
  ]);
  return { documents, total };
}

export function countUnreadNotifications(userId: Types.ObjectId) {
  return NotificationModel.countDocuments({ userId, read: false });
}

export function markNotificationRead(notificationId: string, userId: Types.ObjectId) {
  return NotificationModel.findOneAndUpdate({ _id: notificationId, userId }, { $set: { read: true } }, { new: true }).lean();
}

export function markAllNotificationsRead(userId: Types.ObjectId) {
  return NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
}

// Cross-module read: admin-only triggers (new dealer application, high rejection rate) fan out
// to every active administrator rather than one fixed recipient.
export async function findAdminUserIds(): Promise<Types.ObjectId[]> {
  const admins = await AuthUserModel.find({ role: 'admin', status: 'active' }).select('_id').lean();
  return admins.map((admin) => admin._id as Types.ObjectId);
}

export async function findUserContact(userId: Types.ObjectId): Promise<{ email: string; displayName?: string } | null> {
  const user = await AuthUserModel.findById(userId).select('email displayName').lean() as { email: string; displayName?: string } | null;
  return user ? { email: user.email, displayName: user.displayName } : null;
}
