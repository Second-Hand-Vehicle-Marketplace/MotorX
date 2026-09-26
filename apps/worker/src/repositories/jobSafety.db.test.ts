import mongoose, { Types } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { claimPendingUploadJob, completeUploadJob, retryUploadJob, updateUploadProgress } from './uploadJob.repository.js';
import { findImportedRowNumbers, insertImportedListings, type ImportableListing } from './listing.repository.js';
import { insertRejectedRecords } from './rejectedRecord.repository.js';

// Runs against the disposable test database (compose.test.yml / CI set TEST_MONGODB_URI); these
// guarantees live in MongoDB itself (conditional updates, unique indexes), so mocks cannot prove them.
const uri = process.env.TEST_MONGODB_URI;
const safeUri = uri && /\/motorx_test([_-][a-z0-9-]+)?(\?|$)/i.test(uri) ? uri : undefined;

describe.skipIf(!safeUri)('job safety guarantees in MongoDB', () => {
  const counts = { processedRecords: 10, validRecords: 10, rejectedRecords: 0, duplicateRecords: 0 };
  const jobs = () => mongoose.connection.collection('uploadJobs');

  beforeAll(async () => {
    await mongoose.connect(safeUri!, { serverSelectionTimeoutMS: 10_000 });
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  });
  beforeEach(async () => { await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))); });
  afterAll(async () => { await mongoose.disconnect(); });

  async function createPendingJob() {
    const { insertedId } = await jobs().insertOne({ dealerId: new Types.ObjectId(), storageKey: 'k', fileName: 'f.csv', category: 'car', status: 'pending', attemptCount: 0, imageProcessingStatus: 'none', imageAttemptCount: 0, updatedAt: new Date() });
    return String(insertedId);
  }

  it('lets only the current lease owner write once an expired lease is taken over', async () => {
    const id = await createPendingJob();
    await claimPendingUploadJob(id, 'worker-A');
    await jobs().updateOne({ _id: new Types.ObjectId(id) }, { $set: { leaseExpiresAt: new Date(Date.now() - 1_000) } }); // A stalls; lease expires
    const takeover = await claimPendingUploadJob(id, 'worker-B');

    expect(takeover).toMatchObject({ leaseOwner: 'worker-B', attemptCount: 2 });
    expect(await updateUploadProgress(id, 'worker-A', counts)).toBe(false);
    expect(await completeUploadJob(id, 'worker-A', counts)).toBe(false);
    expect(await retryUploadJob(id, 'worker-A', 'late')).toBe(false);
    expect(await completeUploadJob(id, 'worker-B', counts)).toBe(true);
    expect(await jobs().findOne({ _id: new Types.ObjectId(id) })).toMatchObject({ status: 'completed', validRecords: 10 });
  });

  it('does not let a second worker claim a job whose lease is still valid', async () => {
    const id = await createPendingJob();
    await claimPendingUploadJob(id, 'worker-A');

    expect(await claimPendingUploadJob(id, 'worker-B')).toBeNull();
  });

  it('never stores two listings for the same CSV row of the same upload', async () => {
    const uploadJobId = new Types.ObjectId();
    const row = {
      registrationNumber: 'CAX-1234', title: 'Toyota Corolla', make: 'Toyota', model: 'Corolla', year: 2022, category: 'car', price: 8_000_000, currency: 'LKR',
      location: 'Colombo', attributes: {}, dealerId: new Types.ObjectId(), sourceUploadJobId: uploadJobId, sourceRowNumber: 7, images: [], status: 'draft',
    } as unknown as ImportableListing;
    await insertImportedListings([row]);

    await expect(insertImportedListings([row])).rejects.toMatchObject({ code: 11000 });
    expect(await findImportedRowNumbers(uploadJobId, [6, 7, 8])).toEqual(new Set([7]));
  });

  it('records each rejected row once, even when the batch is processed again', async () => {
    const uploadJobId = new Types.ObjectId();
    const records = [{ uploadJobId, rowNumber: 3, originalData: { title: 'x' }, errors: ['bad year'], reason: 'validation' as const }];
    await insertRejectedRecords(records);
    await insertRejectedRecords(records); // retry of the same batch

    expect(await mongoose.connection.collection('rejectedRecords').countDocuments({ uploadJobId })).toBe(1);
  });
});
