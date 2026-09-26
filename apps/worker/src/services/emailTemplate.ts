import type { NotificationDetails } from '../repositories/notification.repository.js';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

const detailLabels: Record<string, string> = { vehicle: 'Vehicle', registrationNumber: 'Registration number', listingId: 'Listing ID', uploadedAt: 'Uploaded', removedAt: 'Removed', category: 'Category' };

function detailRows(details?: NotificationDetails) {
  if (!details) return '';
  return Object.entries(details).filter(([, value]) => value !== null && value !== undefined && value !== '').map(([key, value]) => `<tr><td style="padding:8px 10px;color:#8290a6;font-size:12px">${escapeHtml(detailLabels[key] ?? key)}</td><td style="padding:8px 10px;color:#172033;font-size:13px;font-weight:700">${escapeHtml(String(value))}</td></tr>`).join('');
}

// The one MotorX notification email layout, used for every email the outbox sends.
export function notificationEmailHtml(title: string, message: string, details?: NotificationDetails) {
  const rows = detailRows(details);
  const detailBlock = rows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border:1px solid #e4e9f1;border-radius:10px;overflow:hidden"><tr><td colspan="2" style="padding:10px;background:#f7f9fc;color:#526078;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase">Vehicle record</td></tr>${rows}</table>` : '';
  return `<!doctype html><html><body style="margin:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e4e9f1;border-radius:16px;overflow:hidden"><tr><td style="padding:22px 28px;background:#13233f;color:#fff"><div style="font-size:22px;font-weight:800;letter-spacing:-.3px">Motor<span style="color:#55b7ff">X</span></div><div style="margin-top:5px;color:#b9c9e5;font-size:12px;letter-spacing:1.4px;text-transform:uppercase">Vehicle marketplace</div></td></tr><tr><td style="padding:34px 28px 30px"><div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#eaf5ff;color:#1670b8;font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase">Account notification</div><h1 style="margin:18px 0 12px;font-size:26px;line-height:1.2;color:#172033">${escapeHtml(title)}</h1><p style="margin:0;color:#526078;font-size:16px;line-height:1.65">${escapeHtml(message)}</p>${detailBlock}</td></tr><tr><td style="padding:18px 28px;border-top:1px solid #edf0f5;color:#8290a6;font-size:12px;line-height:1.5">This message was sent by MotorX because an important activity affected your account.<br>© MotorX</td></tr></table></td></tr></table></body></html>`;
}

export function notificationEmailText(title: string, message: string, details?: NotificationDetails) {
  const lines = details ? Object.entries(details).filter(([, value]) => value !== null && value !== '').map(([key, value]) => `${detailLabels[key] ?? key}: ${value}`) : [];
  return `${title}\n\n${message}${lines.length ? `\n\n${lines.join('\n')}` : ''}\n\nThis message was sent by MotorX because an important activity affected your account.`;
}
