import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ storageSend: vi.fn(), findExpired: vi.fn(), markDeleted: vi.fn() }));

vi.mock('../config/env.js', () => ({ env: { DEALER_DOCUMENT_RETENTION_DAYS: 90 } }));
vi.mock('../config/storage.js', () => ({ workerStorageClient: { send: mocks.storageSend }, workerStorageConfig: { bucket: 'test-bucket' } }));
vi.mock('../repositories/dealerDocument.repository.js', () => ({ findDealersWithExpiredDocuments: mocks.findExpired, markDealerDocumentsDeleted: mocks.markDeleted }));

import { runDocumentRetention } from './documentRetention.job.js';

const now = new Date('2026-09-24T00:00:00Z');
const deletedKeys = () => mocks.storageSend.mock.calls.map(([command]) => (command.input as { Key: string }).Key);

describe('dealer document retention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    mocks.storageSend.mockResolvedValue({});
    mocks.markDeleted.mockResolvedValue({ modifiedCount: 1 });
  });

  it('only looks at decisions made more than 90 days ago', async () => {
    mocks.findExpired.mockResolvedValue([]);

    await runDocumentRetention(now);

    expect(mocks.findExpired).toHaveBeenCalledWith(new Date('2026-06-26T00:00:00Z'), 100);
  });

  it('deletes every stored file, then clears the record with the deletion date', async () => {
    const dealerId = new Types.ObjectId();
    mocks.findExpired.mockResolvedValue([{ _id: dealerId, verificationDocuments: [{ key: 'dealer-verification/u1/a.pdf' }, { key: 'dealer-verification/u1/b.jpg' }] }]);

    const result = await runDocumentRetention(now);

    expect(deletedKeys()).toEqual(['dealer-verification/u1/a.pdf', 'dealer-verification/u1/b.jpg']);
    expect(mocks.markDeleted).toHaveBeenCalledWith(dealerId, now);
    expect(result).toEqual({ deletedApplications: 1, failedApplications: 0 });
  });

  it('keeps the record when a storage delete fails, so the next cycle retries it', async () => {
    const failing = new Types.ObjectId();
    const healthy = new Types.ObjectId();
    mocks.findExpired.mockResolvedValue([
      { _id: failing, verificationDocuments: [{ key: 'dealer-verification/u1/a.pdf' }] },
      { _id: healthy, verificationDocuments: [{ key: 'dealer-verification/u2/b.pdf' }] },
    ]);
    mocks.storageSend.mockRejectedValueOnce(new Error('S3 unavailable'));

    const result = await runDocumentRetention(now);

    expect(mocks.markDeleted).not.toHaveBeenCalledWith(failing, expect.anything());
    expect(mocks.markDeleted).toHaveBeenCalledWith(healthy, now);
    expect(result).toEqual({ deletedApplications: 1, failedApplications: 1 });
  });
});
