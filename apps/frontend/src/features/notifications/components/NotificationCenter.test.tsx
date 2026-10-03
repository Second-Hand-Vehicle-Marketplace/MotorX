import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notificationApi = vi.hoisted(() => ({ list: vi.fn(), unreadCount: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() }));
vi.mock('../services/notificationApi', () => ({ notificationApi }));

import { NotificationCenter } from './NotificationCenter';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const note = (id: string, overrides = {}) => ({
  id, type: 'upload_completed', title: `Title ${id}`, message: `Message ${id}`, read: false, createdAt: minutesAgo(5), channels: ['in_app'], emailStatus: null, details: null, ...overrides,
});

function renderCentre() {
  render(<MemoryRouter initialEntries={['/dealer']}><Routes><Route path="/dealer" element={<NotificationCenter />} /><Route path="/dealer/listings" element={<><NotificationCenter /><p>Stale listings page</p></>} /></Routes></MemoryRouter>);
}

describe('notification centre', () => {
  beforeEach(() => { vi.clearAllMocks(); notificationApi.markRead.mockResolvedValue(undefined); notificationApi.markAllRead.mockResolvedValue(undefined); });

  it('shows the unread count and the list, with details, times and e-mail status', async () => {
    notificationApi.unreadCount.mockResolvedValue(2);
    notificationApi.list.mockResolvedValue({ notifications: [
      note('a', { createdAt: minutesAgo(0), channels: ['in_app', 'email'], emailStatus: 'sent', details: { vehicle: 'Toyota Aqua', registrationNumber: 'CAB-1234', note: null } }),
      note('b', { createdAt: minutesAgo(180), type: 'upload_failed', channels: ['in_app', 'email'], emailStatus: 'failed' }),
      note('c', { createdAt: minutesAgo(60 * 50), read: true, channels: ['in_app', 'email'], emailStatus: 'pending' }),
    ], meta: null });
    renderCentre();

    expect(await screen.findByText('2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open notifications' }));
    const panel = screen.getByRole('region', { name: 'Notifications' });
    expect(within(panel).getByText('Title a')).toBeInTheDocument();
    expect(within(panel).getByText('Just now')).toBeInTheDocument();
    expect(within(panel).getByText('3h ago')).toBeInTheDocument();
    expect(within(panel).getByText('2d ago')).toBeInTheDocument();
    expect(within(panel).getByText('Toyota Aqua')).toBeInTheDocument();
    expect(within(panel).getByText('Email sent successfully')).toBeInTheDocument();
    expect(within(panel).getByText('Email sent with an issue')).toBeInTheDocument();
    expect(within(panel).getByText('Email sent pending')).toBeInTheDocument();
  });

  it('marks one notification read, then all of them', async () => {
    notificationApi.unreadCount.mockResolvedValue(2);
    notificationApi.list.mockResolvedValue({ notifications: [note('a', { createdAt: minutesAgo(12) }), note('b')], meta: null });
    renderCentre();
    await userEvent.click(await screen.findByRole('button', { name: 'Open notifications' }));
    expect(await screen.findByText('12m ago')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Title a'));
    expect(notificationApi.markRead).toHaveBeenCalledWith('a');
    expect(screen.getByText('1')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Title a')); // already read: no second request
    expect(notificationApi.markRead).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
    expect(notificationApi.markAllRead).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark all read' })).toBeDisabled());
  });

  it('opens the stale listings from a stale-stock reminder', async () => {
    notificationApi.unreadCount.mockResolvedValue(1);
    notificationApi.list.mockResolvedValue({ notifications: [note('s', { type: 'stale_listings', title: '12 listings need attention' })], meta: null });
    renderCentre();
    await userEvent.click(await screen.findByRole('button', { name: 'Open notifications' }));
    await userEvent.click(await screen.findByText('12 listings need attention'));
    expect(await screen.findByText('Stale listings page')).toBeInTheDocument();
  });

  it('says when there is nothing new, caps a large count, and stays quiet if loading fails', async () => {
    notificationApi.unreadCount.mockResolvedValue(150);
    notificationApi.list.mockResolvedValue({ notifications: [], meta: null });
    renderCentre();
    expect(await screen.findByText('99+')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open notifications' }));
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close notifications' }));
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument();
  });

  it('does not break the page when the notification service is down', async () => {
    notificationApi.unreadCount.mockRejectedValue(new Error('down'));
    notificationApi.list.mockRejectedValue(new Error('down'));
    renderCentre();
    await waitFor(() => expect(notificationApi.unreadCount).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Open notifications' })).toBeInTheDocument();
  });
});
