import { beforeEach, describe, expect, it, vi } from 'vitest';

// The API modules are thin, but they own the URLs, query parameters and the conversion from the
// server's shapes to the UI's. These tests pin those down against a stubbed HTTP client.
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('@/shared/services/apiClient', () => ({ apiClient: http }));

import { adminApi } from '@/features/admin/services/adminApi';
import { buyerApi } from '@/features/buyers/services/buyerApi';
import {
  approveDealerApplication, getDealerDocumentUrl, getMyDealerApplication, getPendingDealerApplications, openDealerDocument,
  rejectDealerApplication, submitDealerApplication, updateMyDealerProfile,
} from '@/features/dealers/services/dealerApi';
import { inventoryApi } from '@/features/inventory/services/inventoryApi';
import { listingApi } from '@/features/listings/services/listingApi';

const listingDto = {
  id: 'l1', dealerId: 'd1', registrationNumber: 'CAB-1234', title: 'Toyota Aqua 2018', make: 'Toyota', model: 'Aqua', year: 2018, price: 6_000_000, currency: 'LKR',
  location: 'Colombo', description: null, status: 'active', publishedAt: '2026-09-01T00:00:00Z', lastConfirmedAt: null, category: 'car',
  attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 60_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1500 },
  images: [{ key: 'k1', url: 'https://img/1.jpg', thumbUrl: 'https://img/thumbs/1.jpg', alt: null, order: 0 }, { key: 'k2', url: 'https://img/2.jpg', thumbUrl: null, alt: 'Side', order: 1 }],
};
const pagination = { page: 2, limit: 10, total: 25, totalPages: 3 };
const dealer = {
  id: 'dl1', userId: 'u1', businessName: 'Lanka Motors', registrationNumber: 'PV1', phone: '0771234567', address: '1 Main St', representativeName: 'Nimal', city: 'Colombo', province: 'Western',
  businessPhone: '0112345678', businessEmail: 'sales@lanka.lk', website: null, dealershipType: 'used', brands: ['Toyota'], description: 'Used cars', inventoryCount: null,
  verificationDocuments: [], status: 'pending', rejectionReason: null, reviewedBy: null, reviewedAt: null, createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
};
const ok = (data: unknown, meta: unknown = null) => ({ data: { success: true, data, meta } });

describe('listing API (dealer)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('turns listing records into the UI model: first photo primary, missing text filled in', async () => {
    http.get.mockResolvedValue(ok([listingDto], { pagination }));
    const page = await listingApi.getMyListings(2, 10, { status: 'active', stale: true });

    expect(http.get).toHaveBeenCalledWith('/listings/mine', { params: { page: 2, limit: 10, status: 'active', stale: true } });
    expect(page).toMatchObject({ total: 25, page: 2, pageSize: 10, totalPages: 3 });
    expect(page.data[0]).toMatchObject({ description: '', images: [{ id: 'k1', isPrimary: true, alt: 'Toyota Aqua 2018', thumbUrl: 'https://img/thumbs/1.jpg' }, { id: 'k2', isPrimary: false, alt: 'Side', thumbUrl: undefined }] });
  });

  it('uses the right endpoint for each listing operation', async () => {
    http.get.mockResolvedValue(ok(listingDto));
    http.post.mockResolvedValue(ok(listingDto));
    http.patch.mockResolvedValue(ok(listingDto));
    http.delete.mockResolvedValue(ok(listingDto));

    await listingApi.getMyListing('l1');
    expect(http.get).toHaveBeenLastCalledWith('/listings/mine/l1');
    await listingApi.createListing({ title: 'x' } as never);
    expect(http.post).toHaveBeenLastCalledWith('/listings', { title: 'x' });
    await listingApi.updateListing('l1', { price: 1 } as never);
    expect(http.patch).toHaveBeenLastCalledWith('/listings/l1', { price: 1 });
    await listingApi.updateListingStatus('l1', { status: 'sold' } as never);
    expect(http.patch).toHaveBeenLastCalledWith('/listings/l1/status', { status: 'sold' });
    await listingApi.reorderImages('l1', ['k2', 'k1']);
    expect(http.patch).toHaveBeenLastCalledWith('/listings/l1/images/reorder', { imageKeys: ['k2', 'k1'] });
    await listingApi.deleteImage('l1', 'a/b.jpg');
    expect(http.delete).toHaveBeenLastCalledWith('/listings/l1/images/a%2Fb.jpg');
    await listingApi.deleteListing('l1');
    expect(http.delete).toHaveBeenLastCalledWith('/listings/l1');

    const file = new File(['x'], 'car.jpg', { type: 'image/jpeg' });
    await listingApi.uploadImage('l1', file, 'Front');
    const form = http.post.mock.lastCall![1] as FormData;
    expect(http.post.mock.lastCall![0]).toBe('/listings/l1/images');
    expect(form.get('image')).toBe(file);
    expect(form.get('alt')).toBe('Front');
  });

  it('reads stats and sends bulk actions', async () => {
    http.get.mockResolvedValue(ok({ total: 3 }));
    expect(await listingApi.getMyListingStats()).toEqual({ total: 3 });
    http.post.mockResolvedValue(ok({ updated: 2 }));
    expect(await listingApi.bulkAction({ action: 'publish', listingIds: ['l1', 'l2'] } as never)).toEqual({ updated: 2 });
    expect(http.post).toHaveBeenCalledWith('/listings/mine/bulk', { action: 'publish', listingIds: ['l1', 'l2'] });
  });
});

describe('buyer API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('browses and searches with filters and paging', async () => {
    http.get.mockResolvedValue(ok({ listings: [listingDto], pagination, search: { query: 'aqua', mode: 'structured', correctedTerms: {} } }));
    const browse = await buyerApi.listVehicles({ make: 'Toyota' }, 2, 10);
    expect(http.get).toHaveBeenLastCalledWith('/listings', { params: { page: 2, limit: 10, make: 'Toyota' } });
    expect(browse).toMatchObject({ total: 25, totalPages: 3, data: [{ id: 'l1', dealer: null }] });

    await buyerApi.searchVehicles({ q: 'aqua' }, 1, 9);
    expect(http.get).toHaveBeenLastCalledWith('/search', { params: { page: 1, limit: 9, q: 'aqua' } });
  });

  it('loads similar vehicles, recommendations and one vehicle with its dealer', async () => {
    http.get.mockResolvedValue(ok({ listings: [listingDto] }));
    expect(await buyerApi.getSimilarVehicles('l1', 4)).toHaveLength(1);
    expect(http.get).toHaveBeenLastCalledWith('/listings/l1/similar', { params: { limit: 4 } });

    expect(await buyerApi.getRecommendedVehicles([], 8)).toEqual([]);
    const callsBefore = http.get.mock.calls.length;
    expect(http.get.mock.calls.length).toBe(callsBefore); // nothing viewed yet: no request at all
    await buyerApi.getRecommendedVehicles(['a', 'b'], 8);
    expect(http.get).toHaveBeenLastCalledWith('/listings/recommendations', { params: { viewed: 'a,b', limit: 8 } });

    http.get.mockResolvedValue(ok({ ...listingDto, dealer: { businessName: 'Lanka Motors', location: 'Colombo, Western', phone: '1', email: 'e', description: '', website: null } }));
    const vehicle = await buyerApi.getVehicle('l1');
    expect(vehicle.dealer).toMatchObject({ businessName: 'Lanka Motors' });
  });
});

describe('inventory API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uploads a CSV with its category and reports progress', async () => {
    http.post.mockImplementation(async (_url: string, _form: FormData, config: { onUploadProgress: (e: { loaded: number; total?: number }) => void }) => {
      config.onUploadProgress({ loaded: 50, total: 200 });
      config.onUploadProgress({ loaded: 10 }); // size unknown: no progress reported
      return ok({ id: 'job1' });
    });
    const progress: number[] = [];
    const file = new File(['a,b'], 'cars.csv', { type: 'text/csv' });
    expect(await inventoryApi.uploadCsv('car', file, (p) => progress.push(p))).toEqual({ id: 'job1' });
    const form = http.post.mock.lastCall![1] as FormData;
    expect(form.get('category')).toBe('car');
    expect(form.get('file')).toBe(file);
    expect(progress).toEqual([25]);

    await inventoryApi.uploadImagesZip('job1', new File(['z'], 'photos.zip'), (p) => progress.push(p));
    expect(http.post.mock.lastCall![0]).toBe('/dealer/uploads/job1/images');
  });

  it('lists uploads and rejected rows, and retries', async () => {
    http.get.mockResolvedValue(ok({ uploads: [{ id: 'job1' }], records: [{ rowNumber: 2 }], pagination }));
    expect(await inventoryApi.listUploads(2, 10)).toMatchObject({ data: [{ id: 'job1' }], total: 25, pageSize: 10 });
    expect(await inventoryApi.getRejectedRecords('job1', 1, 50)).toMatchObject({ data: [{ rowNumber: 2 }] });
    expect(http.get).toHaveBeenLastCalledWith('/dealer/uploads/job1/rejected-records', { params: { page: 1, limit: 50 } });

    http.get.mockResolvedValue(ok({ id: 'job1' }));
    await inventoryApi.getUpload('job1');
    expect(http.get).toHaveBeenLastCalledWith('/dealer/uploads/job1');
    http.get.mockResolvedValue({ data: new Blob(['h']) });
    expect(await inventoryApi.downloadTemplate('car')).toBeInstanceOf(Blob);
    expect(http.get).toHaveBeenLastCalledWith('/dealer/uploads/template/car', { responseType: 'blob' });

    http.post.mockResolvedValue(ok({ id: 'job1' }));
    await inventoryApi.retryUpload('job1');
    expect(http.post).toHaveBeenLastCalledWith('/dealer/uploads/job1/retry');
    await inventoryApi.retryImages('job1');
    expect(http.post).toHaveBeenLastCalledWith('/dealer/uploads/job1/images/retry');
  });
});

describe('dealer API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits an application with its documents and checks the reply', async () => {
    http.post.mockResolvedValue(ok(dealer));
    const reg = new File(['%PDF'], 'reg.pdf'); const id = new File(['%PDF'], 'id.pdf');
    const result = await submitDealerApplication({ businessName: 'Lanka Motors', brands: ['Toyota', 'Honda'], website: undefined } as never, { businessRegistration: reg, identityProof: id });

    const form = http.post.mock.lastCall![1] as FormData;
    expect(form.get('brands')).toBe('Toyota,Honda');
    expect(form.has('website')).toBe(false);
    expect(form.get('businessRegistration')).toBe(reg);
    expect(form.has('additionalDocument')).toBe(false);
    expect(result).toMatchObject({ businessName: 'Lanka Motors', reviewHistory: [], submittedAt: '' });
  });

  it('rejects a reply that does not match the expected shape', async () => {
    http.get.mockResolvedValue(ok({ id: 'broken' }));
    await expect(getMyDealerApplication()).rejects.toThrow();
  });

  it('reviews applications and updates the profile', async () => {
    http.get.mockResolvedValue(ok([dealer]));
    expect(await getPendingDealerApplications('approved')).toHaveLength(1);
    expect(http.get).toHaveBeenLastCalledWith('/admin/dealer-applications', { params: { status: 'approved' } });

    http.patch.mockResolvedValue(ok({ ...dealer, status: 'approved' }));
    expect((await approveDealerApplication('dl1')).status).toBe('approved');
    await rejectDealerApplication('dl1', 'Unreadable');
    expect(http.patch).toHaveBeenLastCalledWith('/admin/dealer-applications/dl1/reject', { reason: 'Unreadable' });
    await updateMyDealerProfile({ phone: '0770000000' });
    expect(http.patch).toHaveBeenLastCalledWith('/dealers/me/profile', { phone: '0770000000' });
    expect(getDealerDocumentUrl('dl1', 2)).toBe('/admin/dealer-applications/dl1/documents/2');
  });

  it('opens a verification document in a new tab, and closes the tab if loading fails', async () => {
    const tab = { location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(tab as never);
    URL.createObjectURL = vi.fn(() => 'blob:doc');
    URL.revokeObjectURL = vi.fn();
    http.get.mockResolvedValueOnce({ data: new Blob(['%PDF']) });
    await openDealerDocument('dl1', 0);
    expect(tab.location.href).toBe('blob:doc');

    http.get.mockImplementationOnce(() => Promise.reject(new Error('Forbidden')));
    const failure = await openDealerDocument('dl1', 0).then(() => null, (error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect(tab.close).toHaveBeenCalled();
  });
});

describe('admin API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads every admin collection with its filters and default page size', async () => {
    http.get.mockResolvedValue(ok([{ id: 'x' }], pagination));
    expect(await adminApi.listUsers({ role: 'dealer' })).toMatchObject({ users: [{ id: 'x' }], meta: pagination });
    expect(http.get).toHaveBeenLastCalledWith('/admin/users', { params: { role: 'dealer' } });
    expect((await adminApi.listListings({ status: 'active' })).listings).toHaveLength(1);
    expect((await adminApi.listAuditLogs({ eventType: 'dealer_approved' })).logs).toHaveLength(1);
    expect(http.get).toHaveBeenLastCalledWith('/admin/audit-logs', { params: { limit: 50, eventType: 'dealer_approved' } });
    expect((await adminApi.listUploads()).uploads).toHaveLength(1);
    expect(http.get).toHaveBeenLastCalledWith('/admin/uploads', { params: { limit: 50 } });

    http.get.mockResolvedValue(ok({ totalUsers: 4 }));
    expect(await adminApi.getStats()).toEqual({ totalUsers: 4 });
    await adminApi.getSystemHealth();
    expect(http.get).toHaveBeenLastCalledWith('/admin/system-health');
  });

  it('suspends users and removes listings', async () => {
    http.patch.mockResolvedValue(ok({ id: 'u1', status: 'suspended' }));
    expect(await adminApi.setUserStatus('u1', 'suspended')).toMatchObject({ status: 'suspended' });
    expect(http.patch).toHaveBeenCalledWith('/admin/users/u1', { status: 'suspended' });
    http.delete.mockResolvedValue(ok({ id: 'l1' }));
    await adminApi.removeListing('l1');
    expect(http.delete).toHaveBeenCalledWith('/admin/listings/l1');
  });
});
