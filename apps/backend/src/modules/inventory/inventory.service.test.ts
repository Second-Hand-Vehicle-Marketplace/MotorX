import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { csvTemplatesByCategory } from '@motorx/shared-contracts';

const mocks = vi.hoisted(() => ({
  storeCsv: vi.fn(), deleteCsv: vi.fn(), createJob: vi.fn(), enqueueUpload: vi.fn(), enqueueImages: vi.fn(),
  resetFailedUpload: vi.fn(), resetFailedImages: vi.fn(), warn: vi.fn(), assertCapacity: vi.fn(),
}));

vi.mock('../../config/logger.js', () => ({ logger: { warn: mocks.warn } }));
vi.mock('./inventory.storage.js', () => ({ storeInventoryCsv: mocks.storeCsv, deleteInventoryCsv: mocks.deleteCsv, storeInventoryImagesZip: vi.fn(), deleteInventoryImagesZip: vi.fn() }));
vi.mock('../marketplace/listing.service.js', () => ({ assertDealerListingCapacity: mocks.assertCapacity }));
vi.mock('./inventory.queue.js', () => ({ enqueueInventoryUpload: mocks.enqueueUpload, enqueueInventoryImages: mocks.enqueueImages }));
vi.mock('./inventory.repository.js', () => ({
  createUploadJob: mocks.createJob, resetFailedUploadJob: mocks.resetFailedUpload, resetFailedImageProcessing: mocks.resetFailedImages,
  findDealerUploadJob: vi.fn(), listDealerUploadJobs: vi.fn(), listRejectedRecordsForUpload: vi.fn(), markImageProcessingPending: vi.fn(),
}));

import { createInventoryUpload, retryDealerUpload, retryDealerUploadImages } from './inventory.service.js';

const dealerId = new Types.ObjectId();
const jobId = new Types.ObjectId();
const headers = csvTemplatesByCategory.car!.fields.map((field) => field.key).join(",");
const csvFile = { originalname: 'stock.csv', size: 100, buffer: Buffer.from(`${headers}\n`) } as Express.Multer.File;
const jobDocument = (overrides: Record<string, unknown> = {}) => ({ toObject: () => ({ _id: jobId, dealerId, fileName: 'stock.csv', status: 'pending', createdAt: new Date(), ...overrides }) });

describe('inventory upload acceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storeCsv.mockResolvedValue(undefined);
    mocks.assertCapacity.mockResolvedValue(undefined);
    mocks.createJob.mockResolvedValue({ _id: jobId, ...jobDocument() });
  });

  it('queues the job straight away when Redis is available', async () => {
    mocks.enqueueUpload.mockResolvedValue(undefined);

    const upload = await createInventoryUpload(dealerId, 'car', csvFile);

    expect(upload).toMatchObject({ id: String(jobId), status: 'pending' });
    expect(mocks.enqueueUpload).toHaveBeenCalledWith(String(jobId));
    expect(mocks.warn).not.toHaveBeenCalled();
  });

  it('keeps the accepted upload (file and job) when Redis is down, for the worker to queue later', async () => {
    mocks.enqueueUpload.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:6379'));

    const upload = await createInventoryUpload(dealerId, 'car', csvFile);

    expect(upload).toMatchObject({ id: String(jobId), status: 'pending' });
    expect(mocks.deleteCsv).not.toHaveBeenCalled();
    expect(mocks.warn).toHaveBeenCalledWith(expect.objectContaining({ uploadJobId: String(jobId) }), expect.stringContaining('Enqueue deferred'));
  });

  it('does not make the dealer wait when Redis hangs instead of refusing', async () => {
    vi.useFakeTimers();
    mocks.enqueueUpload.mockReturnValue(new Promise(() => undefined)); // never settles

    const pending = createInventoryUpload(dealerId, 'car', csvFile);
    await vi.advanceTimersByTimeAsync(3_000);

    await expect(pending).resolves.toMatchObject({ status: 'pending' });
    vi.useRealTimers();
  });

  it('tells a dealer at the listing limit before storing anything', async () => {
    mocks.assertCapacity.mockRejectedValue(Object.assign(new Error('limit'), { statusCode: 409 }));

    await expect(createInventoryUpload(dealerId, 'car', csvFile)).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.storeCsv).not.toHaveBeenCalled();
  });

  it('still removes the stored file if the MongoDB job itself cannot be created', async () => {
    mocks.createJob.mockRejectedValue(new Error('MongoDB unavailable'));

    await expect(createInventoryUpload(dealerId, 'car', csvFile)).rejects.toThrow('MongoDB unavailable');
    expect(mocks.deleteCsv).toHaveBeenCalledTimes(1);
    expect(mocks.enqueueUpload).not.toHaveBeenCalled();
  });
});

describe('controlled retry of failed jobs', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.enqueueUpload.mockResolvedValue(undefined); mocks.enqueueImages.mockResolvedValue(undefined); });

  it('re-queues a failed CSV import owned by the dealer', async () => {
    mocks.resetFailedUpload.mockResolvedValue(jobDocument());

    await expect(retryDealerUpload(dealerId, String(jobId))).resolves.toMatchObject({ status: 'pending' });
    expect(mocks.resetFailedUpload).toHaveBeenCalledWith(String(jobId), dealerId);
    expect(mocks.enqueueUpload).toHaveBeenCalledWith(String(jobId));
  });

  it('refuses to retry an upload that is not failed (or belongs to another dealer)', async () => {
    mocks.resetFailedUpload.mockResolvedValue(null);

    await expect(retryDealerUpload(dealerId, String(jobId))).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.enqueueUpload).not.toHaveBeenCalled();
  });

  it('re-queues failed photo processing under the images job', async () => {
    mocks.resetFailedImages.mockResolvedValue(jobDocument({ status: 'completed', imageProcessingStatus: 'pending' }));

    await retryDealerUploadImages(dealerId, String(jobId));

    expect(mocks.enqueueImages).toHaveBeenCalledWith(String(jobId));
  });
});
