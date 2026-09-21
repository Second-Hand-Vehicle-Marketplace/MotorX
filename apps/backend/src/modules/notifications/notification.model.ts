import mongoose, { type HydratedDocument, type Types } from 'mongoose';
import {
  notificationChannels,
  notificationEmailStatuses,
  notificationTypes,
  type NotificationChannel,
  type NotificationEmailStatus,
  type NotificationType,
} from '@motorx/shared-contracts';

export interface Notification {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  emailStatus: NotificationEmailStatus;
  read: boolean;
  details?: Record<string, string | number | null>;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;

const { Schema, model, models } = mongoose;

const notificationSchema = new Schema<Notification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'AuthUser', required: true },
    type: { type: String, enum: notificationTypes, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    channels: { type: [String], enum: notificationChannels, default: ['in_app'] },
    emailStatus: { type: String, enum: notificationEmailStatuses, default: 'not_applicable' },
    read: { type: Boolean, required: true, default: false },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false },
);
// Every read of this collection is scoped to one user's inbox, newest first.
notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel = models.Notification ?? model<Notification>('Notification', notificationSchema);
