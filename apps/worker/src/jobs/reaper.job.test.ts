import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getJob: vi.fn(), add: vi.fn(),
  expiredUploads: vi.fn(), expiredImages: vi.fn(), staleUploads: vi.fn(), staleImages: vi.fn(),
  failUpload: vi.fn(), failImages: vi.fn(),
}));

vi.mock('../config/env.js', () => ({ env: { JOB_MAX_RECLAIM_ATTEMPTS: 5, PENDING_JOB_REENQUEUE_AFTER_MS: 120_000 } }));
vi.mock('../config/queue.js', () => ({ inventoryQueueProducer: { getJob: mocks.getJob, add: mocks.add } }));
vi.mock('../repositories/workerHeartbeat.repository.js', () => ({ upsertWorkerHeartbeat: vi.fn() }));
vi.mock('../repositories/uploadJob.repository.js', () => ({
  findExpiredLeaseUploadJobs: mocks.expiredUploads, findExpiredLeaseImageJobs: mocks.expiredImages,
  findStalePendingUploadJobs: mocks.staleUploads, findStalePendingImageJobs: mocks.staleImages,
  failUploadJob: mocks.failUpload, failImageProcessing: mocks.failImages,
}));

import { ensureQueued, runLeaseReaper } from './reaper.job.js';

const bullJob = (state: string) => ({ getState: vi.fn().mockResolvedValue(state), remove: vi.fn().mockResolvedValue(undefined) });

describe('queue reconciliation (reaper)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const finder of [mocks.expiredUploads, mocks.expiredImages, mocks.staleUploads, mocks.staleImages]) finder.mockResolvedValue([]);
  });

  it('re-queues a pending upload whose queue message was never written (e.g. Redis was down)', async () => {
    const id = new Types.ObjectId();
    mocks.staleUploads.mockResolvedValue([{ _id: id, attemptCount: 0 }]);
    mocks.getJob.mockResolvedValue(undefined);

    await runLeaseReaper(new Date('2026-09-25T10:00:00Z'));

    expect(mocks.staleUploads).toHaveBeenCalledWith(new Date('2026-09-25T09:58:00Z'));
    expect(mocks.add).toHaveBeenCalledWith('process-inventory', { uploadJobId: String(id) }, { jobId: String(id) });
  });

  it('re-queues photo processing whose BullMQ attempts were exhausted, under the images job id', async () => {
    const id = new Types.ObjectId();
    const exhausted = bullJob('failed');
    mocks.staleImages.mockResolvedValue([{ _id: id, imageAttemptCount: 3 }]);
    mocks.getJob.mockResolvedValue(exhausted);

    await runLeaseReaper();

    expect(exhausted.remove).toHaveBeenCalled();
    expect(mocks.add).toHaveBeenCalledWith('process-inventory-images', { uploadJobId: String(id) }, { jobId: `${String(id)}-images` });
  });

  it('fails a job whose durable attempt budget is used up instead of re-queuing it forever', async () => {
    const id = new Types.ObjectId();
    mocks.expiredUploads.mockResolvedValue([{ _id: id, attemptCount: 5 }]);

    await runLeaseReaper();

    expect(mocks.failUpload).toHaveBeenCalledWith(String(id), expect.stringContaining('after 5 attempts'));
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it.each(['waiting', 'delayed', 'active'])('leaves a job alone while its queue message is %s', async (state) => {
    const alive = bullJob(state);
    mocks.getJob.mockResolvedValue(alive);

    expect(await ensureQueued('process-inventory', 'job-1', 'job-1')).toBe(false);
    expect(alive.remove).not.toHaveBeenCalled();
    expect(mocks.add).not.toHaveBeenCalled();
  });
});
