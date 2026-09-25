import type { Types } from 'mongoose';
import type { NotificationChannel, NotificationDto, NotificationType } from '@motorx/shared-contracts';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { logger } from '../../config/logger.js';
import type { NotificationDocument } from './notification.model.js';
import {
  countUnreadNotifications,
  createNotification,
  findAdminUserIds,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from './notification.repository.js';

function serializeNotification(record: Record<string, any>): NotificationDto {
  return {
    id: String(record._id),
    type: record.type,
    title: record.title,
    message: record.message,
    channels: record.channels,
    emailStatus: record.emailStatus,
    read: record.read,
    details: record.details,
    createdAt: (record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt)).toISOString(),
  };
}

type NotificationDetails = Record<string, string | number | null>;

// Records one notification. Emails are only queued here (emailStatus 'pending'); the worker's
// outbox job sends them with retries. A failure to record a notification is logged, never thrown,
// so it cannot make an already committed action (approval, suspension, removal) look failed.
async function notify(userId: Types.ObjectId, type: NotificationType, title: string, message: string, channels: NotificationChannel[], details?: NotificationDetails) {
  try { return await createNotification({ userId, type, title, message, channels, details }); }
  catch (error) {
    logger.error({ err: error, type, userId: String(userId) }, 'Could not record notification.');
    return null;
  }
}

async function notifyMany(userIds: Types.ObjectId[], type: NotificationType, title: string, message: string, channels: NotificationChannel[]) {
  await Promise.all(userIds.map((userId) => notify(userId, type, title, message, channels)));
}

// -- In-app only --------------------------------------------------------------------------

export function notifyUploadJobClean(dealerUserId: Types.ObjectId) {
  return notify(dealerUserId, 'upload_completed', 'Inventory upload completed', 'Your CSV upload finished processing with no rejected records.', ['in_app']);
}

export function notifyImageProcessingClean(dealerUserId: Types.ObjectId) {
  return notify(dealerUserId, 'image_processing_completed', 'Vehicle photos processed', 'Your vehicle-photos zip finished processing and every photo matched a listing.', ['in_app']);
}

export async function notifyDealerApplicationSubmitted(businessName: string) {
  const adminIds = await findAdminUserIds().catch(() => []);
  return notifyMany(adminIds, 'dealer_application_submitted', 'New dealer application', `${businessName} submitted a dealer application for review.`, ['in_app']);
}

export async function notifyUploadHighRejectionRate(uploadJobId: string, rejectionRate: number) {
  const adminIds = await findAdminUserIds().catch(() => []);
  return notifyMany(adminIds, 'upload_high_rejection_rate', 'High rejection rate on an upload', `Upload ${uploadJobId} rejected ${Math.round(rejectionRate * 100)}% of its records.`, ['in_app']);
}

// -- In-app + email -------------------------------------------------------------------------

export function notifyUploadJobFailed(dealerUserId: Types.ObjectId, reason?: string) {
  return notify(dealerUserId, 'upload_failed', 'Inventory upload failed', reason ? `Your CSV upload failed: ${reason}` : 'Your CSV upload failed.', ['in_app', 'email']);
}

export function notifyUploadJobCompletedWithErrors(dealerUserId: Types.ObjectId, rejectedRecords: number) {
  return notify(dealerUserId, 'upload_completed_with_errors', 'Inventory upload completed with errors', `Your CSV upload finished with ${rejectedRecords} rejected record(s). Review them in your upload history.`, ['in_app', 'email']);
}

export function notifyImageProcessingFailed(dealerUserId: Types.ObjectId, reason?: string) {
  return notify(dealerUserId, 'image_processing_failed', 'Vehicle photo processing failed', reason ? `Your vehicle-photos zip failed to process: ${reason}` : 'Your vehicle-photos zip failed to process.', ['in_app', 'email']);
}

export function notifyImageProcessingCompletedWithErrors(dealerUserId: Types.ObjectId, unmatchedFolders: number) {
  return notify(dealerUserId, 'image_processing_completed_with_errors', 'Vehicle photo processing completed with errors', `Your vehicle-photos zip finished but ${unmatchedFolders} folder(s) didn't match any listing.`, ['in_app', 'email']);
}

export function notifyDealerApplicationDecision(dealerUserId: Types.ObjectId, decision: 'approved' | 'rejected', reason?: string) {
  const title = decision === 'approved' ? 'Dealer application approved' : 'Dealer application rejected';
  const message = decision === 'approved' ? 'Your dealer application was approved. You can now access the dealer portal.' : `Your dealer application was rejected: ${reason ?? 'no reason provided'}.`;
  return notify(dealerUserId, decision === 'approved' ? 'dealer_application_approved' : 'dealer_application_rejected', title, message, ['in_app', 'email']);
}

export function notifyListingRemoved(dealerUserId: Types.ObjectId, listingTitle: string, details: NotificationDetails) {
  return notify(dealerUserId, 'listing_removed', 'Listing removed by an administrator', `Your listing "${listingTitle}" was removed by an administrator. Review the vehicle record below to identify the exact listing.`, ['in_app', 'email'], details);
}

// -- Email-primary --------------------------------------------------------------------------

export function notifyAccountSuspended(userId: Types.ObjectId) {
  return notify(userId, 'account_suspended', 'Your MotorX account has been suspended', 'Your account has been suspended. Contact support if you believe this is a mistake.', ['email']);
}

// -- Reads for the notifications API ---------------------------------------------------------

export async function getNotificationsForUser(userId: Types.ObjectId, page: number, limit: number) {
  const result = await listNotificationsForUser(userId, page, limit);
  return { data: result.documents.map(serializeNotification), meta: buildPaginationMeta(page, limit, result.total) };
}

export async function getUnreadNotificationCount(userId: Types.ObjectId) {
  return { unreadCount: await countUnreadNotifications(userId) };
}

export async function markOneNotificationRead(notificationId: string, userId: Types.ObjectId) {
  return markNotificationRead(notificationId, userId);
}

export function markAllNotificationsAsRead(userId: Types.ObjectId) {
  return markAllNotificationsRead(userId);
}
