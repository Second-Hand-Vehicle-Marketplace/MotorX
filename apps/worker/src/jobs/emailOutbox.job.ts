import { mailer, mailerConfig } from '../config/mailer.js';
import { findAuthUserById } from '../repositories/authUser.repository.js';
import { claimNextDueEmail, markEmailFailed, markEmailSent, scheduleEmailRetry } from '../repositories/notification.repository.js';
import { notificationEmailHtml, notificationEmailText } from '../services/emailTemplate.js';

// Delay before each retry (after attempts 1, 2, 3, 4); the 5th failed attempt is final.
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
const MAX_EMAILS_PER_CYCLE = 25;

// Sends queued notification emails (the outbox). Business actions only record a `pending` email;
// this job delivers it, retrying with increasing delays, so an SMTP outage never fails or reverses
// the action that caused the email. Delivery is at-least-once: a crash between sending and
// recording "sent" can repeat one email, which is preferable to losing it.
export async function runEmailOutbox(now = () => new Date()) {
  let sent = 0; let failed = 0; let retried = 0;
  for (let processed = 0; processed < MAX_EMAILS_PER_CYCLE; processed += 1) {
    const notification = await claimNextDueEmail(now());
    if (!notification) break;
    try {
      const recipient = await findAuthUserById(notification.userId);
      if (!recipient) { await markEmailFailed(notification._id, 'Recipient user account was not found.'); failed += 1; continue; }
      await mailer.sendMail({
        from: mailerConfig.from,
        to: recipient.email,
        replyTo: mailerConfig.from,
        subject: `MotorX | ${notification.title}`,
        text: notificationEmailText(notification.title, notification.message, notification.details),
        html: notificationEmailHtml(notification.title, notification.message, notification.details),
        headers: { 'X-Auto-Response-Suppress': 'All' },
      });
      await markEmailSent(notification._id);
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (notification.emailAttempts >= MAX_ATTEMPTS) { await markEmailFailed(notification._id, message); failed += 1; }
      else { await scheduleEmailRetry(notification._id, new Date(now().getTime() + RETRY_DELAYS_MS[notification.emailAttempts - 1]!), message); retried += 1; }
    }
  }
  if (sent || failed || retried) console.log('Email outbox cycle finished.', { sent, retried, failed });
  return { sent, retried, failed };
}
