import { Readable } from 'node:stream';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  storageSend: vi.fn(), claim: vi.fn(), update: vi.fn(), complete: vi.fn(), fail: vi.fn(),
  findActive: vi.fn(), insertListings: vi.fn(), insertRejected: vi.fn(),
}));

vi.mock('../config/storage.js', () => ({ workerStorageClient: { send: mocks.storageSend }, workerStorageConfig: { bucket: 'test-bucket' } }));
vi.mock('../config/env.js', () => ({ env: { ETL_BATCH_SIZE: 250 } }));
vi.mock('../repositories/uploadJob.repository.js', () => ({ claimPendingUploadJob: mocks.claim, updateUploadProgress: mocks.update, completeUploadJob: mocks.complete, failUploadJob: mocks.fail }));
vi.mock('../repositories/listing.repository.js', () => ({ findActivelyListedRegistrations: mocks.findActive, insertImportedListings: mocks.insertListings }));
vi.mock('../repositories/rejectedRecord.repository.js', () => ({ insertRejectedRecords: mocks.insertRejected }));
vi.mock('./notification.service.js', () => ({ notifyUploadJobResult: vi.fn(), notifyUploadHighRejectionRate: vi.fn() }));

import { extractInventoryUpload } from './uploadJob.service.js';

describe('inventory upload ETL service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const dealerId = new Types.ObjectId();
    mocks.claim.mockResolvedValue({ storageKey: 'inventory/test.csv', dealerId, category: 'car' });
    mocks.findActive.mockResolvedValue(new Set()); mocks.insertListings.mockResolvedValue([]); mocks.insertRejected.mockResolvedValue([]);
  });

  it('persists valid rows, records invalid rows, and completes with accurate counters', async () => {
    const csv = 'registrationNumber,title,make,model,year,price,mileageKm,fuelType,transmission,bodyType,condition,engineCapacityCc,location\nCAX-1234,Toyota Corolla,Toyota,Corolla,2022,8000000,20000,petrol,automatic,sedan,used,1800,Colombo\n,Bad,,,bad,-1,-2,steam,unknown,spaceship,used,,\n';
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

  it('routes duplicate registration numbers to rejected records instead of listings', async () => {
    mocks.findActive.mockResolvedValue(new Set(['CAX1234']));
    const csv = 'registrationNumber,title,make,model,year,price,mileageKm,fuelType,transmission,bodyType,condition,engineCapacityCc,location\nCAX-1234,Toyota Corolla,Toyota,Corolla,2022,8000000,20000,petrol,automatic,sedan,used,1800,Colombo\n';
    mocks.storageSend.mockResolvedValue({ Body: Readable.from(csv) });
    const result = await extractInventoryUpload(new Types.ObjectId().toString());
    expect(result).toMatchObject({ validRecords: 0, duplicateRecords: 1 });
  });
});
