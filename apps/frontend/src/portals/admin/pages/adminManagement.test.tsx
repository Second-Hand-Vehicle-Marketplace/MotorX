import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const adminApi = vi.hoisted(() => ({
  listUsers: vi.fn(), setUserStatus: vi.fn(), listListings: vi.fn(), removeListing: vi.fn(), listAuditLogs: vi.fn(), getSystemHealth: vi.fn(),
}));
vi.mock('@/features/admin/services/adminApi', () => ({ adminApi }));

import { AuditLogs } from './AuditLogs';
import { ListingMonitoring } from './ListingMonitoring';
import { SystemHealth } from './SystemHealth';
import { UserManagement } from './UserManagement';

const renderAt = (path: string, route: string, element: React.ReactElement) =>
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path={route} element={element} /></Routes></MemoryRouter>);
const user = (id: string, overrides = {}) => ({ id, email: `${id}@example.com`, displayName: `User ${id}`, role: 'dealer', status: 'active', createdAt: '2026-09-01T00:00:00Z', lastLoginAt: '2026-09-20T00:00:00Z', ...overrides });
const listing = (id: string, overrides = {}) => ({
  id, dealerId: 'd', dealerName: 'Lanka Motors', title: `Car ${id}`, make: 'Toyota', model: 'Aqua', year: 2018, category: 'car', registrationNumber: 'R',
  price: 6_000_000, currency: 'LKR', status: 'active', createdAt: '2026-09-01T00:00:00Z', ...overrides,
});

describe('User management', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists users, filters by role and search, and suspends one without reloading the rest', async () => {
    adminApi.listUsers.mockResolvedValue({ users: [user('a'), user('b', { role: 'buyer', displayName: '' })], meta: null });
    adminApi.setUserStatus.mockResolvedValue(user('a', { status: 'suspended' }));
    renderAt('/admin/users', '/admin/users', <UserManagement />);

    expect(await screen.findByText('User a')).toBeInTheDocument();
    expect(screen.getByText('Unnamed user')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole('combobox'), 'dealer');
    await waitFor(() => expect(adminApi.listUsers).toHaveBeenLastCalledWith({ search: undefined, role: 'dealer', limit: 100 }));
    await userEvent.type(screen.getByPlaceholderText('Search by name or email...'), ' nimal ');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(adminApi.listUsers).toHaveBeenLastCalledWith({ search: 'nimal', role: 'dealer', limit: 100 }));

    const row = (await screen.findByText('User a')).closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Suspend' }));
    expect(adminApi.setUserStatus).toHaveBeenCalledWith('a', 'suspended');
    expect(await within(row).findByRole('button', { name: 'Activate' })).toBeInTheDocument();
    expect(within(row).getByText('Suspended')).toBeInTheDocument();
  });

  it('shows an empty result and load or update errors', async () => {
    adminApi.listUsers.mockResolvedValueOnce({ users: [], meta: null });
    renderAt('/admin/users', '/admin/users', <UserManagement />);
    expect(await screen.findByText('No users match these filters.')).toBeInTheDocument();

    adminApi.listUsers.mockRejectedValueOnce(new Error('Service unavailable'));
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await userEvent.selectOptions(screen.getByRole('combobox'), 'admin');
    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
  });

  it('reports a failed status change', async () => {
    adminApi.listUsers.mockResolvedValue({ users: [user('a')], meta: null });
    adminApi.setUserStatus.mockRejectedValue(new Error('Not allowed'));
    renderAt('/admin/users', '/admin/users', <UserManagement />);
    await userEvent.click(await screen.findByRole('button', { name: 'Suspend' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Not allowed');
  });
});

describe('Listing monitoring', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.spyOn(window, 'confirm').mockReturnValue(true); });

  it('filters listings and archives one after confirmation', async () => {
    adminApi.listListings.mockResolvedValue({ listings: [listing('1'), listing('2', { status: 'archived' })], meta: null });
    adminApi.removeListing.mockResolvedValue(listing('1', { status: 'archived' }));
    renderAt('/admin/listings', '/admin/listings', <ListingMonitoring />);

    const row = (await screen.findByText('Car 1')).closest('tr')!;
    expect(within(row).getByText('Lanka Motors')).toBeInTheDocument();
    expect(within((screen.getByText('Car 2')).closest('tr')!).getByRole('button', { name: 'Archived' })).toBeDisabled();

    await userEvent.click(within(row).getByRole('button', { name: 'Remove Listing' }));
    expect(window.confirm).toHaveBeenCalledWith('Archive "Car 1"?');
    expect(adminApi.removeListing).toHaveBeenCalledWith('1');
    expect(await within(row).findByRole('button', { name: 'Archived' })).toBeDisabled();

    const [statusSelect, categorySelect] = screen.getAllByRole('combobox');
    await userEvent.selectOptions(statusSelect, 'active');
    await userEvent.selectOptions(categorySelect, 'car');
    await userEvent.type(screen.getByPlaceholderText('Search by title, make, or model...'), 'aqua');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(adminApi.listListings).toHaveBeenLastCalledWith({ search: 'aqua', status: 'active', category: 'car', limit: 100 }));
  });

  it('drops an archived listing from an "active" view and keeps it when the dealer cancels', async () => {
    adminApi.listListings.mockResolvedValue({ listings: [listing('1')], meta: null });
    adminApi.removeListing.mockResolvedValue(listing('1', { status: 'archived' }));
    renderAt('/admin/listings', '/admin/listings', <ListingMonitoring />);
    await screen.findByText('Car 1');
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0]!, 'active');

    vi.mocked(window.confirm).mockReturnValueOnce(false);
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Listing' }));
    expect(adminApi.removeListing).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Remove Listing' }));
    await waitFor(() => expect(screen.queryByText('Car 1')).not.toBeInTheDocument());
    expect(screen.getByText('No listings match these filters.')).toBeInTheDocument();
  });

  it('shows load and archive errors', async () => {
    adminApi.listListings.mockRejectedValueOnce(new Error('Database offline'));
    renderAt('/admin/listings', '/admin/listings', <ListingMonitoring />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Database offline');

    adminApi.listListings.mockResolvedValue({ listings: [listing('1')], meta: null });
    adminApi.removeListing.mockRejectedValue(new Error('Listing locked'));
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1]!, 'van');
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Listing' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Listing locked');
  });
});

describe('Audit logs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads filters from the address, shows events and pages through them', async () => {
    adminApi.listAuditLogs.mockResolvedValue({
      logs: [{ id: 'e1', eventType: 'dealer_approved', actorId: 'a', actorName: 'Admin One', targetId: 'd', targetName: 'Lanka Motors', details: 'Approved after review', timestamp: '2026-09-20T10:00:00Z' }],
      meta: { page: 1, limit: 50, total: 60, totalPages: 2 },
    });
    renderAt('/admin/audit-logs?eventType=dealer_approved&from=2026-09-01', '/admin/audit-logs', <AuditLogs />);

    expect(await screen.findByText('Dealer Approved')).toBeInTheDocument();
    expect(adminApi.listAuditLogs).toHaveBeenCalledWith({ eventType: 'dealer_approved', from: '2026-09-01', to: undefined, page: 1 });
    expect(screen.getByText('1–50 of 60 events')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(adminApi.listAuditLogs).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));

    await userEvent.selectOptions(screen.getByRole('combobox'), 'user_suspended');
    await waitFor(() => expect(adminApi.listAuditLogs).toHaveBeenLastCalledWith(expect.objectContaining({ eventType: 'user_suspended', page: 1 })));
  });

  it('distinguishes "nothing recorded" from "nothing matches" and from an outage', async () => {
    adminApi.listAuditLogs.mockResolvedValue({ logs: [], meta: null });
    const { unmount } = renderAt('/admin/audit-logs', '/admin/audit-logs', <AuditLogs />);
    expect(await screen.findByText('No administrative events recorded.')).toBeInTheDocument();
    unmount();

    renderAt('/admin/audit-logs?to=2026-09-30', '/admin/audit-logs', <AuditLogs />);
    expect(await screen.findByText('No events match these filters.')).toBeInTheDocument();

    adminApi.listAuditLogs.mockRejectedValue(new Error('timeout'));
    await userEvent.selectOptions(screen.getByRole('combobox'), 'listing_removed');
    expect(await screen.findByRole('alert')).toHaveTextContent('Audit logs are unavailable right now: timeout');
  });
});

describe('System health', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows each service status, or the error when the check fails', async () => {
    adminApi.getSystemHealth.mockResolvedValueOnce({ checkedAt: '2026-09-28T10:00:00Z', backend: { status: 'ok', uptimeSeconds: 3600 }, database: { status: 'ok', readyState: 1 }, queue: { status: 'ok' }, worker: { status: 'degraded' } });
    const { unmount } = render(<SystemHealth />);
    expect(screen.getByText('Checking services...')).toBeInTheDocument();
    expect(await screen.findByText('ETL Worker')).toBeInTheDocument();
    expect(screen.getByText('MongoDB Database')).toBeInTheDocument();
    unmount();

    adminApi.getSystemHealth.mockRejectedValueOnce(new Error('Forbidden'));
    render(<SystemHealth />);
    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
  });
});
