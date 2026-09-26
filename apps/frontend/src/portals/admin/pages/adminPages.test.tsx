import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getApplications: vi.fn(), getStats: vi.fn(), listUploads: vi.fn(), listAuditLogs: vi.fn(), listUsers: vi.fn(),
}));
vi.mock('@/features/dealers/services/dealerApi', () => ({ getPendingDealerApplications: mocks.getApplications, approveDealerApplication: vi.fn(), rejectDealerApplication: vi.fn(), openDealerDocument: vi.fn() }));
vi.mock('@/features/admin/services/adminApi', () => ({ adminApi: { getStats: mocks.getStats, listUploads: mocks.listUploads, listAuditLogs: mocks.listAuditLogs, listUsers: mocks.listUsers } }));

import { AdminDashboard } from './AdminDashboard';
import { DealerApprovals } from './DealerApprovals';
import { UploadMonitoring } from './UploadMonitoring';

const application = (id: string, overrides = {}) => ({
  id, userId: 'u', businessName: `Dealer ${id}`, registrationNumber: 'R', phone: '1', address: 'a', representativeName: 'r', city: 'c', province: 'p', businessPhone: '1', businessEmail: 'e@x.lk',
  website: null, dealershipType: 'used', brands: [], description: 'd', inventoryCount: null, verificationDocuments: [], status: 'pending', rejectionReason: null, reviewedBy: null,
  reviewedAt: null, documentsDeletedAt: null, submittedAt: '2026-09-20T10:00:00Z', reviewHistory: [], createdAt: '2026-09-20T10:00:00Z', updatedAt: '2026-09-20T10:00:00Z', ...overrides,
});
const renderAt = (path: string, route: string, element: React.ReactElement) => render(<MemoryRouter initialEntries={[path]}><Routes><Route path={route} element={element} /></Routes></MemoryRouter>);

describe('Dealer Approvals', () => {
  beforeEach(() => { vi.clearAllMocks(); Element.prototype.scrollIntoView = vi.fn(); });

  it('opens the tab from the link (?status=approved) instead of always showing pending', async () => {
    mocks.getApplications.mockResolvedValue([application('a1', { status: 'approved' })]);
    renderAt('/admin/dealers?status=approved', '/admin/dealers', <DealerApprovals />);
    await waitFor(() => expect(mocks.getApplications).toHaveBeenCalledWith('approved'));
  });

  it('highlights and scrolls to the exact application from a dashboard link, and shows earlier rejections', async () => {
    mocks.getApplications.mockResolvedValue([application('a1'), application('a2', { reviewHistory: [{ status: 'rejected', reason: 'Unreadable certificate.', reviewedAt: '2026-09-10T10:00:00Z', submittedAt: null }] })]);
    renderAt('/admin/dealers?status=pending&applicationId=a2', '/admin/dealers', <DealerApprovals />);

    const selected = await screen.findByText('Dealer a2');
    expect(selected.closest('article')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Dealer a1').closest('article')).not.toHaveAttribute('aria-current');
    expect(screen.getByText(/Unreadable certificate/)).toBeInTheDocument();
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  });
});

describe('Admin dashboard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('says a section is unavailable instead of showing zero or "none yet" when it fails to load', async () => {
    mocks.getStats.mockRejectedValue(new Error('down'));
    mocks.listUploads.mockRejectedValue(new Error('down'));
    mocks.listAuditLogs.mockResolvedValue({ logs: [], meta: null });
    mocks.getApplications.mockResolvedValue([]);
    renderAt('/admin', '/admin', <AdminDashboard />);

    expect(await screen.findByText(/Inventory activity could not be loaded/)).toBeInTheDocument();
    expect(screen.queryByText('No inventory uploads yet.')).not.toBeInTheDocument();
    expect(screen.getByText('No administrative activity yet.')).toBeInTheDocument(); // this one really is empty
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4); // totals unknown, not 0
  });

  it('links a waiting application to that exact application', async () => {
    mocks.getStats.mockResolvedValue({ totalUsers: 1, activeDealers: 1, registeredDealers: 1, totalListings: 0, activeListings: 0, pendingDealerApplications: 1 });
    mocks.listUploads.mockResolvedValue({ uploads: [], meta: null });
    mocks.listAuditLogs.mockResolvedValue({ logs: [], meta: null });
    mocks.getApplications.mockResolvedValue([application('a9')]);
    renderAt('/admin', '/admin', <AdminDashboard />);

    expect((await screen.findByText('Dealer a9')).closest('a')).toHaveAttribute('href', '/admin/dealers?status=pending&applicationId=a9');
  });
});

describe('Upload monitoring', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.listUsers.mockResolvedValue({ users: [] }); });

  it('loads only the linked upload when opened with ?uploadId', async () => {
    mocks.listUploads.mockResolvedValue({ uploads: [{ id: 'u1', dealerId: 'd', dealerName: 'Dealer', fileName: 'stock.csv', fileSize: 1, status: 'failed', totalRecords: 0, processedRecords: 0, validRecords: 0, rejectedRecords: 0, failureReason: 'Storage timed out.', createdAt: '2026-09-20T10:00:00Z', completedAt: null }], meta: null });
    renderAt('/admin/uploads?uploadId=u1', '/admin/uploads', <UploadMonitoring />);

    expect(await screen.findByText('Storage timed out.')).toBeInTheDocument();
    expect(mocks.listUploads).toHaveBeenCalledWith({ uploadId: 'u1' });
    expect(screen.getByRole('button', { name: 'Show all uploads' })).toBeInTheDocument();
  });

  it('passes the date range and page to the server', async () => {
    mocks.listUploads.mockResolvedValue({ uploads: [], meta: { page: 2, limit: 50, total: 60, totalPages: 2 } });
    renderAt('/admin/uploads?from=2026-09-01&to=2026-09-30&page=2', '/admin/uploads', <UploadMonitoring />);

    await waitFor(() => expect(mocks.listUploads).toHaveBeenCalledWith(expect.objectContaining({ from: '2026-09-01', to: '2026-09-30', page: 2 })));
    expect(await screen.findByText('No uploads match these filters.')).toBeInTheDocument();
  });
});
