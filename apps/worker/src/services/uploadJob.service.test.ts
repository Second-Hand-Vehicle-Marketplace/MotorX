import { Readable } from 'node:stream';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  storageSend: vi.fn(), claim: vi.fn(), update: vi.fn(), complete: vi.fn(), fail: vi.fn(), retry: vi.fn(), renew: vi.fn(),
  findActive: vi.fn(), findImported: vi.fn(), countOpen: vi.fn(), insertListings: vi.fn(), insertRejected: vi.fn(), notifyResult: vi.fn(),
}));

vi.mock('../config/storage.js', () => ({ workerStorageClient: { send: mocks.storageSend }, workerStorageConfig: { bucket: 'test-bucket' } }));
vi.mock('../config/env.js', () => ({ env: { ETL_BATCH_SIZE: 2, JOB_MAX_RECLAIM_ATTEMPTS: 5, MAX_LISTINGS_PER_DEALER: 2_000 } }));
vi.mock('../repositories/uploadJob.repository.js', () => ({
  JOB_LEASE_MS: 120_000, claimPendingUploadJob: mocks.claim, updateUploadProgress: mocks.update, completeUploadJob: mocks.complete,
  failUploadJob: mocks.fail, retryUploadJob: mocks.retry, renewUploadLease: mocks.renew,
}));
vi.mock('../repositories/listing.repository.js', () => ({ findActivelyListedRegistrations: mocks.findActive, insertImportedListings: mocks.insertListings, findImportedRowNumbers: mocks.findImported, countOpenDealerListings: mocks.countOpen }));
vi.mock('../repositories/rejectedRecord.repository.js', () => ({ insertRejectedRecords: mocks.insertRejected }));
vi.mock('../pipeline/generateEmbedding.js', () => ({ generateEmbedding: vi.fn().mockResolvedValue(undefined) }));
vi.mock('./notification.service.js', () => ({ notifyUploadJobResult: mocks.notifyResult, notifyUploadHighRejectionRate: vi.fn() }));

import { extractInventoryUpload } from './uploadJob.service.js';

const header = 'registrationNumber,title,make,model,year,price,mileageKm,fuelType,transmission,bodyType,condition,engineCapacityCc,location\n';
const car = (registration: string) => `${registration},Toyota Corolla,Toyota,Corolla,2022,8000000,20000,petrol,automatic,sedan,used,1800,Colombo\n`;
const badRow = ',Bad,,,bad,-1,-2,steam,unknown,spaceship,used,,\n';
const insertedRowNumbers = () => mocks.insertListings.mock.calls.flatMap(([rows]) => (rows as Array<{ sourceRowNumber: number }>).map((row) => row.sourceRowNumber));

describe('inventory upload ETL service', () => {
  const dealerId = new Types.ObjectId();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.claim.mockResolvedValue({ storageKey: 'inventory/test.csv', dealerId, category: 'car', attemptCount: 1 });
    mocks.findActive.mockResolvedValue(new Set()); mocks.findImported.mockResolvedValue(new Set()); mocks.countOpen.mockResolvedValue(0);
    mocks.insertListings.mockResolvedValue([]); mocks.insertRejected.mockResolvedValue(undefined);
    mocks.update.mockResolvedValue(true); mocks.complete.mockResolvedValue(true); mocks.fail.mockResolvedValue(true); mocks.retry.mockResolvedValue(true);
  });

  it('persists valid rows, records invalid rows, and completes with accurate counters', async () => {
    mocks.storageSend.mockResolvedValue({ Body: Readable.from(header + car('CAX-1234') + badRow) });
    const result = await extractInventoryUpload(new Types.ObjectId().toString());
    expect(result).toMatchObject({ processedRecords: 2, validRecords: 1, rejectedRecords: 1, duplicateRecords: 0, stage: 'completed' });
    expect(insertedRowNumbers()).toEqual([2]);
    expect(mocks.complete).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ validRecords: 1, rejectedRecords: 1 }));
  });

  it('uses one lease-owner token for the claim and every later write', async () => {
    mocks.storageSend.mockResolvedValue({ Body: Readable.from(header + car('CAX-1234')) });
    await extractInventoryUpload(new Types.ObjectId().toString());
    const owner = mocks.claim.mock.calls[0]![1];
    expect(owner).toEqual(expect.any(String));
    expect(mocks.update.mock.calls.every((call) => call[1] === owner)).toBe(true);
    expect(mocks.complete.mock.calls[0]![1]).toBe(owner);
  });

  it('fails permanently (and tells the dealer) when the CSV itself cannot be parsed', async () => {
    mocks.storageSend.mockResolvedValue({ Body: Readable.from('title,make\nOne,Toyota,extra\n') });
    const result = await extractInventoryUpload(new Types.ObjectId().toString());
    expect(result).toMatchObject({ stage: 'failed' });
    expect(mocks.fail).toHaveBeenCalledTimes(1); expect(mocks.retry).not.toHaveBeenCalled(); expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.notifyResult).toHaveBeenCalledWith(dealerId, expect.any(String), 'failed', undefined, expect.any(String));
  });

  it('hands a temporary storage failure back as pending and rethrows so BullMQ retries with backoff', async () => {
    mocks.storageSend.mockRejectedValue(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }));
    await expect(extractInventoryUpload(new Types.ObjectId().toString())).rejects.toThrow('socket hang up');
    expect(mocks.retry).toHaveBeenCalledTimes(1); expect(mocks.fail).not.toHaveBeenCalled();
    expect(mocks.notifyResult).not.toHaveBeenCalled(); // no "failed" message for a job that will retry
  });

  it('fails a temporary failure once the durable attempt budget is used up', async () => {
    mocks.claim.mockResolvedValue({ storageKey: 'inventory/test.csv', dealerId, category: 'car', attemptCount: 5 });
    mocks.storageSend.mockRejectedValue(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }));
    await expect(extractInventoryUpload(new Types.ObjectId().toString())).resolves.toMatchObject({ stage: 'failed' });
    expect(mocks.retry).not.toHaveBeenCalled(); expect(mocks.fail).toHaveBeenCalledTimes(1);
  });

  it('routes duplicate registration numbers to rejected records instead of listings', async () => {
    mocks.findActive.mockResolvedValue(new Set(['CAX1234']));
    mocks.storageSend.mockResolvedValue({ Body: Readable.from(header + car('CAX-1234')) });
    const result = await extractInventoryUpload(new Types.ObjectId().toString());
    expect(result).toMatchObject({ validRecords: 0, duplicateRecords: 1 });
  });

  it('resumes after a crash from the last checkpoint without importing any row twice', async () => {
    // Previous attempt: batch 1 (rows 2-3) was checkpointed; batch 2 (rows 4-5) had inserted row 4
    // when the worker died, before the checkpoint for that batch was written.
    mocks.claim.mockResolvedValue({ storageKey: 'inventory/test.csv', dealerId, category: 'car', attemptCount: 2, processedRecords: 2, validRecords: 2, rejectedRecords: 0, duplicateRecords: 0 });
    mocks.findImported.mockResolvedValue(new Set([4]));
    // Rows imported earlier are drafts now, so the duplicate check sees their plates as listed.
    mocks.findActive.mockImplementation(async (keys: string[]) => new Set(keys.filter((key) => ['CAX0001', 'CAX0002', 'CAX0003'].includes(key))));
    mocks.storageSend.mockResolvedValue({ Body: Readable.from(header + car('CAX-0001') + car('CAX-0002') + car('CAX-0003') + car('CAX-0004')) });

    const result = await extractInventoryUpload(new Types.ObjectId().toString());

    expect(insertedRowNumbers()).toEqual([5]); // only the row never imported
    expect(result).toMatchObject({ processedRecords: 4, validRecords: 4, rejectedRecords: 0, duplicateRecords: 0, stage: 'completed' });
  });

  it("rejects rows beyond the dealer's listing limit instead of importing them", async () => {
    mocks.countOpen.mockResolvedValue(1_999); // room for exactly one more listing
    mocks.storageSend.mockResolvedValue({ Body: Readable.from(header + car('CAX-0001') + car('CAX-0002')) });

    const result = await extractInventoryUpload(new Types.ObjectId().toString());

    expect(insertedRowNumbers()).toEqual([2]);
    expect(result).toMatchObject({ validRecords: 1, rejectedRecords: 1 });
    expect(mocks.insertRejected).toHaveBeenCalledWith([expect.objectContaining({ rowNumber: 3, errors: [expect.stringContaining('Listing limit of 2000')] })]);
  });

  it('stops without writing when another worker has taken over the lease', async () => {
    mocks.update.mockResolvedValue(false); // checkpoint refused: this worker no longer owns the job
    mocks.storageSend.mockResolvedValue({ Body: Readable.from(header + car('CAX-0001') + car('CAX-0002') + car('CAX-0003')) });

    const result = await extractInventoryUpload(new Types.ObjectId().toString());

    expect(result).toMatchObject({ stage: 'lease-lost' });
    expect(mocks.complete).not.toHaveBeenCalled(); expect(mocks.fail).not.toHaveBeenCalled(); expect(mocks.retry).not.toHaveBeenCalled();
    expect(mocks.insertListings).toHaveBeenCalledTimes(1); // stopped after the first batch
  });
});
