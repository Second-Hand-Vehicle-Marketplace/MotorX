import mongoose, { type Types } from 'mongoose';

export type NotificationChannel = 'in_app' | 'email';
export type NotificationEmailStatus = 'not_applicable' | 'pending' | 'sent' | 'failed';

export interface WorkerNotification {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  emailStatus: NotificationEmailStatus;
  read: boolean;
}

// Mirrors the backend's notification.model.ts shape exactly — same 'notifications' collection,
// written from both apps, same pattern already used for uploadJobs/listings.
const notificationSchema = new mongoose.Schema<WorkerNotification>({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  channels: { type: [String], default: ['in_app'] },
  emailStatus: { type: String, default: 'not_applicable' },
  read: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
const NotificationModel = mongoose.models.WorkerNotification ?? mongoose.model<WorkerNotification>('WorkerNotification', notificationSchema, 'notifications');

export function createNotification(input: Pick<WorkerNotification, 'userId' | 'type' | 'title' | 'message' | 'channels'>) {
  return NotificationModel.create({ ...input, emailStatus: input.channels.includes('email') ? 'pending' : 'not_applicable' });
}

export function setNotificationEmailStatus(notificationId: Types.ObjectId, emailStatus: NotificationEmailStatus) {
  return NotificationModel.updateOne({ _id: notificationId }, { $set: { emailStatus } });
}
