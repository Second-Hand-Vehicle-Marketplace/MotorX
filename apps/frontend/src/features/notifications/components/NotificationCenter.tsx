import React, { useEffect, useState } from 'react';
import type { NotificationDto } from '@motorx/shared-contracts';
import { notificationApi } from '../services/notificationApi';

const typeTone: Record<string, string> = {
  dealer_application_submitted: 'notification-tone-amber',
  upload_high_rejection_rate: 'notification-tone-amber',
  upload_failed: 'notification-tone-red',
  upload_completed_with_errors: 'notification-tone-amber',
  image_processing_failed: 'notification-tone-red',
  image_processing_completed_with_errors: 'notification-tone-amber',
  account_suspended: 'notification-tone-red',
};

function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const detailLabels: Record<string, string> = { vehicle: 'Vehicle', registrationNumber: 'Reg.', listingId: 'Listing', uploadedAt: 'Uploaded', removedAt: 'Removed', category: 'Category' };

export const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      const [count, result] = await Promise.all([notificationApi.unreadCount(), notificationApi.list()]);
      setUnreadCount(count);
      setNotifications(result.notifications);
    } catch {
      // Notification polling should never interrupt the active portal.
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const markRead = async (notification: NotificationDto) => {
    if (notification.read) return;
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    setUnreadCount((current) => Math.max(0, current - 1));
    await notificationApi.markRead(notification.id).catch(() => undefined);
  };

  const markAllRead = async () => {
    setLoading(true);
    await notificationApi.markAllRead().catch(() => undefined);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    setLoading(false);
  };

  return <div className="notification-center">
    <button className="notification-trigger" aria-label="Open notifications" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17H9m9-2V11a6 6 0 10-12 0v4l-2 2h16l-2-2zm-4 5H9" /></svg>
      {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    {open && <>
      <button className="notification-backdrop" aria-label="Close notifications" onClick={() => setOpen(false)} />
      <section className="notification-panel" aria-label="Notifications">
        <div className="notification-panel-header"><div><p className="notification-eyebrow">MotorX inbox</p><h2>Notifications</h2></div><button className="notification-mark-all" onClick={() => void markAllRead()} disabled={loading || unreadCount === 0}>Mark all read</button></div>
        <div className="notification-list">
          {notifications.length === 0 && <div className="notification-empty"><span className="notification-empty-icon">✓</span><strong>You're all caught up</strong><span>New activity will appear here.</span></div>}
          {notifications.map((notification) => <button key={notification.id} className={`notification-item ${notification.read ? '' : 'notification-item-unread'}`} onClick={() => void markRead(notification)}>
            <span className={`notification-dot ${typeTone[notification.type] ?? 'notification-tone-blue'}`} />
            <span className="notification-item-body"><span className="notification-item-top"><strong>{notification.title}</strong><time>{timeAgo(notification.createdAt)}</time></span><span>{notification.message}</span>{notification.details && <span className="notification-details">{Object.entries(notification.details).map(([key, value]) => value !== null && <span key={key}><b>{detailLabels[key] ?? key}:</b> {key.endsWith('At') && typeof value === 'string' ? new Date(value).toLocaleString() : value}</span>)}</span>}{notification.channels.includes('email') && <small>Email sent {notification.emailStatus === 'sent' ? 'successfully' : notification.emailStatus === 'failed' ? 'with an issue' : 'pending'}</small>}</span>
          </button>)}
        </div>
      </section>
    </>}
  </div>;
};
