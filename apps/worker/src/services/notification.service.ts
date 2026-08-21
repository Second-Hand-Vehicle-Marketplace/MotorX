import type { Types } from 'mongoose';
import { mailer, mailerConfig } from '../config/mailer.js';
import { findAdminUserIds, findAuthUserById } from '../repositories/authUser.repository.js';
import { createNotification, setNotificationEmailStatus, type NotificationChannel } from '../repositories/notification.repository.js';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

function notificationEmailHtml(title: string, message: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e4e9f1;border-radius:16px;overflow:hidden"><tr><td style="padding:24px 28px;background:#13233f;color:#fff"><div style="font-size:22px;font-weight:800">Motor<span style="color:#55b7ff">X</span></div><div style="margin-top:5px;color:#b9c9e5;font-size:12px;letter-spacing:1.4px;text-transform:uppercase">Vehicle marketplace</div></td></tr><tr><td style="padding:34px 28px 30px"><div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#eaf5ff;color:#1670b8;font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase">Account notification</div><h1 style="margin:18px 0 12px;font-size:26px;line-height:1.2;color:#172033">${escapeHtml(title)}</h1><p style="margin:0;color:#526078;font-size:16px;line-height:1.65">${escapeHtml(message)}</p></td></tr><tr><td style="padding:18px 28px;border-top:1px solid #edf0f5;color:#8290a6;font-size:12px;line-height:1.5">This message was sent by MotorX because an important activity affected your account.<br>© MotorX</td></tr></table></td></tr></table></body></html>`;
}

// Sends the email leg and records whether it actually went out — a failed send must never
// throw, since the in-app notification record has already been durably created.
async function deliverEmail(notificationId: Types.ObjectId, userId: Types.ObjectId, title: string, message: string) {
  try {
    const user = await findAuthUserById(userId);
    if (!user) throw new Error('Recipient user account was not found.');
    await mailer.sendMail({
      from: mailerConfig.from,
      to: user.email,
      replyTo: mailerConfig.from,
      subject: `MotorX | ${title}`,
      text: `${title}\n\n${message}\n\nThis message was sent by MotorX because an important activity affected your account.`,
      html: notificationEmailHtml(title, message),
      headers: { 'X-Auto-Response-Suppress': 'All' },
    });
    await setNotificationEmailStatus(notificationId, 'sent');
  } catch {
    await setNotificationEmailStatus(notificationId, 'failed');
  }
}

async function notify(userId: Types.ObjectId, type: string, title: string, message: string, channels: NotificationChannel[]) {
  const notification = await createNotification({ userId, type, title, message, channels });
  if (channels.includes('email')) await deliverEmail(notification._id, userId, title, message);
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
  const adminIds = await findAdminUserIds();
  await notifyMany(adminIds, 'upload_high_rejection_rate', 'High rejection rate on an upload', `Upload ${uploadJobId} rejected ${Math.round(rejectionRate * 100)}% of its records.`, ['in_app']);
}

// Notifies the dealer once vehicle-photo zip processing reaches a terminal state.
export function notifyImageProcessingResult(dealerUserId: Types.ObjectId, status: 'completed' | 'completedWithErrors' | 'failed', unmatchedFolders?: number, failureReason?: string) {
  if (status === 'completed') return notify(dealerUserId, 'image_processing_completed', 'Vehicle photos processed', 'Your vehicle-photos zip finished processing and every photo matched a listing.', ['in_app']);
  if (status === 'completedWithErrors') return notify(dealerUserId, 'image_processing_completed_with_errors', 'Vehicle photo processing completed with errors', `Your vehicle-photos zip finished but ${unmatchedFolders ?? 0} folder(s) didn't match any listing.`, ['in_app', 'email']);
  return notify(dealerUserId, 'image_processing_failed', 'Vehicle photo processing failed', failureReason ? `Your vehicle-photos zip failed to process: ${failureReason}` : 'Your vehicle-photos zip failed to process.', ['in_app', 'email']);
}
