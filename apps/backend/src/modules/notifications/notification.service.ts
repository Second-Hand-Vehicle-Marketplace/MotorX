import type { Types } from 'mongoose';
import type { NotificationChannel, NotificationDto, NotificationType } from '@motorx/shared-contracts';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { mailer, mailerConfig } from '../../config/mailer.js';
import type { NotificationDocument } from './notification.model.js';
import {
  countUnreadNotifications,
  createNotification,
  findAdminUserIds,
  findUserContact,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationEmailStatus,
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

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

function detailRows(details?: NotificationDetails) {
  if (!details) return '';
  const labels: Record<string, string> = { vehicle: 'Vehicle', registrationNumber: 'Registration number', listingId: 'Listing ID', uploadedAt: 'Uploaded', removedAt: 'Removed', category: 'Category' };
  return Object.entries(details).filter(([, value]) => value !== null && value !== undefined && value !== '').map(([key, value]) => `<tr><td style="padding:8px 10px;color:#8290a6;font-size:12px">${escapeHtml(labels[key] ?? key)}</td><td style="padding:8px 10px;color:#172033;font-size:13px;font-weight:700">${escapeHtml(String(value))}</td></tr>`).join('');
}

function notificationEmailHtml(title: string, message: string, details?: NotificationDetails) {
  const rows = detailRows(details);
  const detailBlock = rows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border:1px solid #e4e9f1;border-radius:10px;overflow:hidden"><tr><td colspan="2" style="padding:10px;background:#f7f9fc;color:#526078;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase">Vehicle record</td></tr>${rows}</table>` : '';
  return `<!doctype html><html><body style="margin:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e4e9f1;border-radius:16px;overflow:hidden"><tr><td style="padding:22px 28px;background:#13233f;color:#fff"><div style="font-size:22px;font-weight:800;letter-spacing:-.3px">Motor<span style="color:#55b7ff">X</span></div><div style="margin-top:5px;color:#b9c9e5;font-size:12px;letter-spacing:1.4px;text-transform:uppercase">Vehicle marketplace</div></td></tr><tr><td style="padding:34px 28px 30px"><div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#eaf5ff;color:#1670b8;font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase">Account notification</div><h1 style="margin:18px 0 12px;font-size:26px;line-height:1.2;color:#172033">${escapeHtml(title)}</h1><p style="margin:0;color:#526078;font-size:16px;line-height:1.65">${escapeHtml(message)}</p>${detailBlock}</td></tr><tr><td style="padding:18px 28px;border-top:1px solid #edf0f5;color:#8290a6;font-size:12px;line-height:1.5">This message was sent by MotorX because an important activity affected your account.<br>© MotorX</td></tr></table></td></tr></table></body></html>`;
}

// Sends the email leg for one notification and records whether it actually went out — a failed
// send must never surface as a thrown error, since the in-app record has already been created.
async function deliverEmail(notification: NotificationDocument, userId: Types.ObjectId) {
  try {
    const contact = await findUserContact(userId);
    if (!contact) throw new Error('Recipient user account was not found.');
    await mailer.sendMail({
      from: mailerConfig.from,
      to: contact.email,
      replyTo: mailerConfig.from,
      subject: `MotorX | ${notification.title}`,
      text: `${notification.title}\n\n${notification.message}${notification.details ? `\n\n${Object.entries(notification.details).map(([key, value]) => `${key}: ${value}`).join('\n')}` : ''}\n\nThis message was sent by MotorX because an important activity affected your account.`,
      html: notificationEmailHtml(notification.title, notification.message, notification.details),
      headers: { 'X-Auto-Response-Suppress': 'All' },
    });
    await setNotificationEmailStatus(notification._id, 'sent');
  } catch {
    await setNotificationEmailStatus(notification._id, 'failed');
  }
}

// Central entry point for every trigger in the notification delivery strategy: creates the
// in-app record first (always durable), then fires the email leg only if requested.
async function notify(userId: Types.ObjectId, type: NotificationType, title: string, message: string, channels: NotificationChannel[], details?: NotificationDetails) {
  const notification = await createNotification({ userId, type, title, message, channels, details });
  if (channels.includes('email')) await deliverEmail(notification, userId);
  return notification;
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
  const adminIds = await findAdminUserIds();
  return notifyMany(adminIds, 'dealer_application_submitted', 'New dealer application', `${businessName} submitted a dealer application for review.`, ['in_app']);
}

export async function notifyUploadHighRejectionRate(uploadJobId: string, rejectionRate: number) {
  const adminIds = await findAdminUserIds();
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
