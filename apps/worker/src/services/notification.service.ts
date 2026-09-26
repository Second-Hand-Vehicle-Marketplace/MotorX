import type { Types } from 'mongoose';
import { findAdminUserIds } from '../repositories/authUser.repository.js';
import { createNotification, type NotificationChannel, type NotificationDetails } from '../repositories/notification.repository.js';

// Records one notification. Emails are queued (sent later by the outbox job), and a failure to
// record a notification is logged, never thrown: a notification must not fail or appear to fail
// the import or photo processing that has already completed.
async function notify(userId: Types.ObjectId, type: string, title: string, message: string, channels: NotificationChannel[], details?: NotificationDetails) {
  try { await createNotification({ userId, type, title, message, channels, ...(details ? { details } : {}) }); }
  catch (error) { console.error('Could not record notification.', { type, userId: String(userId), message: error instanceof Error ? error.message : String(error) }); }
}

async function notifyMany(userIds: Types.ObjectId[], type: string, title: string, message: string, channels: NotificationChannel[]) {
  await Promise.all(userIds.map((userId) => notify(userId, type, title, message, channels)));
}

// Notifies the dealer once a CSV upload job reaches a terminal state, matching the delivery
// strategy: clean completion stays in-app only, failures/partial failures also send an email.
export function notifyUploadJobResult(dealerUserId: Types.ObjectId, uploadJobId: string, status: 'completed' | 'completedWithErrors' | 'failed', counts?: { rejectedRecords: number; duplicateRecords: number }, failureReason?: string) {
  if (status === 'completed') return notify(dealerUserId, 'upload_completed', 'Inventory upload completed', 'Your CSV upload finished processing with no rejected records.', ['in_app']);
  if (status === 'completedWithErrors') {
    const rejected = (counts?.rejectedRecords ?? 0) + (counts?.duplicateRecords ?? 0);
    return notify(dealerUserId, 'upload_completed_with_errors', 'Inventory upload completed with errors', `Your CSV upload finished with ${rejected} rejected record(s). Review them in your upload history.`, ['in_app', 'email']);
  }
  return notify(dealerUserId, 'upload_failed', 'Inventory upload failed', failureReason ? `Your CSV upload failed: ${failureReason}` : 'Your CSV upload failed.', ['in_app', 'email']);
}

// Advisory-only signal for administrators when a job's rejection rate crosses the threshold —
// not urgent enough to leave the app for, per the delivery strategy, so in-app only.
export async function notifyUploadHighRejectionRate(uploadJobId: string, rejectionRate: number) {
  const adminIds = await findAdminUserIds().catch(() => []);
  await notifyMany(adminIds, 'upload_high_rejection_rate', 'High rejection rate on an upload', `Upload ${uploadJobId} rejected ${Math.round(rejectionRate * 100)}% of its records.`, ['in_app']);
}

// Notifies the dealer once vehicle-photo zip processing reaches a terminal state.
export function notifyImageProcessingResult(dealerUserId: Types.ObjectId, status: 'completed' | 'completedWithErrors' | 'failed', unmatchedFolders?: number, failureReason?: string) {
  if (status === 'completed') return notify(dealerUserId, 'image_processing_completed', 'Vehicle photos processed', 'Your vehicle-photos zip finished processing and every photo matched a listing.', ['in_app']);
  if (status === 'completedWithErrors') return notify(dealerUserId, 'image_processing_completed_with_errors', 'Vehicle photo processing completed with errors', `Your vehicle-photos zip finished but ${unmatchedFolders ?? 0} folder(s) didn't match any listing.`, ['in_app', 'email']);
  return notify(dealerUserId, 'image_processing_failed', 'Vehicle photo processing failed', failureReason ? `Your vehicle-photos zip failed to process: ${failureReason}` : 'Your vehicle-photos zip failed to process.', ['in_app', 'email']);
}

// Reminds a dealer about listings nobody has confirmed for a while, so buyers do not contact them
// about cars already sold. In-app only: it repeats weekly, which would be too often for email.
export function notifyStaleListings(dealerUserId: Types.ObjectId, staleListings: number, days: number) {
  const listings = staleListings === 1 ? '1 listing hasn\'t' : `${staleListings} listings haven't`;
  return notify(dealerUserId, 'stale_listings', 'Some listings may be out of date', `${listings} been updated in ${days} days. Mark them sold, archive them, reduce the price, or confirm they are still available.`, ['in_app'], { staleListings });
}
