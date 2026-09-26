import mongoose, { type Types } from 'mongoose';

export type NotificationChannel = 'in_app' | 'email';
export type NotificationEmailStatus = 'not_applicable' | 'pending' | 'sent' | 'failed';
export type NotificationDetails = Record<string, string | number | null>;

export interface WorkerNotification {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  details?: NotificationDetails;
  emailStatus: NotificationEmailStatus;
  read: boolean;
  // Email outbox state: the worker delivers every `pending` email with retries (see emailOutbox.job.ts).
  emailAttempts: number;
  nextEmailAttemptAt?: Date;
  emailClaimedUntil?: Date;
  emailLastError?: string;
  emailSentAt?: Date;
  createdAt: Date;
}

// Mirrors the backend's notification.model.ts shape exactly — same 'notifications' collection,
// written from both apps, same pattern already used for uploadJobs/listings.
const notificationSchema = new mongoose.Schema<WorkerNotification>({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  channels: { type: [String], default: ['in_app'] },
  details: { type: mongoose.Schema.Types.Mixed },
  emailStatus: { type: String, default: 'not_applicable' },
  read: { type: Boolean, default: false },
  emailAttempts: { type: Number, default: 0 },
  nextEmailAttemptAt: Date,
  emailClaimedUntil: Date,
  emailLastError: String,
  emailSentAt: Date,
}, { timestamps: true, versionKey: false });
notificationSchema.index({ emailStatus: 1, nextEmailAttemptAt: 1 }, { name: 'emailOutbox' });
const NotificationModel = mongoose.models.WorkerNotification ?? mongoose.model<WorkerNotification>('WorkerNotification', notificationSchema, 'notifications');

// Records the notification. The email leg (if any) is only queued here: `pending` rows are sent
// by the outbox job, so creating a notification never waits on, or fails because of, SMTP.
export function createNotification(input: Pick<WorkerNotification, 'userId' | 'type' | 'title' | 'message' | 'channels'> & { details?: NotificationDetails }) {
  const email = input.channels.includes('email');
  return NotificationModel.create({ ...input, emailStatus: email ? 'pending' : 'not_applicable', ...(email ? { nextEmailAttemptAt: new Date() } : {}) });
}

const CLAIM_MS = 2 * 60_000;

// Atomically takes the oldest due email, so several workers never send the same one at once.
// A claim that is never finished (the worker died mid-send) becomes available again after CLAIM_MS.
export function claimNextDueEmail(now = new Date()) {
  return NotificationModel.findOneAndUpdate(
    {
      emailStatus: 'pending',
      $and: [
        { $or: [{ nextEmailAttemptAt: { $exists: false } }, { nextEmailAttemptAt: { $lte: now } }] },
        { $or: [{ emailClaimedUntil: { $exists: false } }, { emailClaimedUntil: { $lt: now } }] },
      ],
    },
    { $set: { emailClaimedUntil: new Date(now.getTime() + CLAIM_MS) }, $inc: { emailAttempts: 1 } },
    { new: true, sort: { createdAt: 1 } },
  ).lean<WorkerNotification & { _id: Types.ObjectId }>();
}

export function markEmailSent(notificationId: Types.ObjectId) {
  return NotificationModel.updateOne({ _id: notificationId }, { $set: { emailStatus: 'sent', emailSentAt: new Date() }, $unset: { emailClaimedUntil: 1, nextEmailAttemptAt: 1, emailLastError: 1 } });
}

export function scheduleEmailRetry(notificationId: Types.ObjectId, nextAttemptAt: Date, error: string) {
  return NotificationModel.updateOne({ _id: notificationId }, { $set: { nextEmailAttemptAt: nextAttemptAt, emailLastError: error.slice(0, 500) }, $unset: { emailClaimedUntil: 1 } });
}

export function markEmailFailed(notificationId: Types.ObjectId, error: string) {
  return NotificationModel.updateOne({ _id: notificationId }, { $set: { emailStatus: 'failed', emailLastError: error.slice(0, 500) }, $unset: { emailClaimedUntil: 1, nextEmailAttemptAt: 1 } });
}
