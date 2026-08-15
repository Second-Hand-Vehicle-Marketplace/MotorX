import { Readable } from 'node:stream';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  storageSend: vi.fn(), claim: vi.fn(), update: vi.fn(), complete: vi.fn(), fail: vi.fn(),
  findCandidates: vi.fn(), insertListings: vi.fn(), insertRejected: vi.fn(),
}));

vi.mock('../config/storage.js', () => ({ workerStorageClient: { send: mocks.storageSend }, workerStorageConfig: { bucket: 'test-bucket' } }));
vi.mock('../config/env.js', () => ({ env: { ETL_BATCH_SIZE: 250 } }));
vi.mock('../repositories/uploadJob.repository.js', () => ({ claimPendingUploadJob: mocks.claim, updateUploadProgress: mocks.update, completeUploadJob: mocks.complete, failUploadJob: mocks.fail }));
vi.mock('../repositories/listing.repository.js', () => ({ findExistingListingCandidates: mocks.findCandidates, insertImportedListings: mocks.insertListings }));
vi.mock('../repositories/rejectedRecord.repository.js', () => ({ insertRejectedRecords: mocks.insertRejected }));

import { extractInventoryUpload } from './uploadJob.service.js';

describe('inventory upload ETL service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const dealerId = new Types.ObjectId();
    mocks.claim.mockResolvedValue({ storageKey: 'inventory/test.csv', dealerId });
    mocks.findCandidates.mockResolvedValue([]); mocks.insertListings.mockResolvedValue([]); mocks.insertRejected.mockResolvedValue([]);
  });

  it('persists valid rows, records invalid rows, and completes with accurate counters', async () => {
    const csv = 'title,make,model,year,price,mileageKm,fuelType,transmission,location\nToyota Corolla,Toyota,Corolla,2022,8000000,20000,petrol,automatic,Colombo\nBad,,,bad,-1,-2,steam,unknown,\n';
    mocks.storageSend.mockResolvedValue({ Body: Readable.from(csv) });
    const result = await extractInventoryUpload(new Types.ObjectId().toString());
    expect(result).toMatchObject({ processedRecords: 2, validRecords: 1, rejectedRecords: 1, duplicateRecords: 0, stage: 'completed' });
    expect(mocks.insertListings).toHaveBeenCalledTimes(1); expect(mocks.insertRejected).toHaveBeenCalledTimes(1);
    expect(mocks.complete).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ validRecords: 1, rejectedRecords: 1 }));
  });

  it('marks the durable upload as failed when CSV parsing fails', async () => {
    mocks.storageSend.mockResolvedValue({ Body: Readable.from('title,make\nOne,Toyota,extra\n') });
    await expect(extractInventoryUpload(new Types.ObjectId().toString())).rejects.toThrow();
    expect(mocks.fail).toHaveBeenCalledTimes(1); expect(mocks.complete).not.toHaveBeenCalled();
  });
});
