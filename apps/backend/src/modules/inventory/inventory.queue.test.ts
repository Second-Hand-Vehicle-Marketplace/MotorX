import { beforeEach, describe, expect, it, vi } from 'vitest';

const queue = vi.hoisted(() => ({ getJob: vi.fn(), add: vi.fn() }));
vi.mock('../../config/queue.js', () => ({ inventoryQueue: queue }));

import { enqueueInventoryImages, enqueueInventoryUpload } from './inventory.queue.js';

const jobIn = (state: string) => ({ getState: vi.fn().mockResolvedValue(state), remove: vi.fn().mockResolvedValue(undefined) });

describe('inventory queue publishing', () => {
  beforeEach(() => { vi.clearAllMocks(); queue.add.mockResolvedValue(undefined); });

  it('queues a new upload under its fixed job ID', async () => {
    queue.getJob.mockResolvedValue(undefined);
    await enqueueInventoryUpload('u1');
    expect(queue.add).toHaveBeenCalledWith('process-inventory', { uploadJobId: 'u1' }, { jobId: 'u1' });
  });

  it('processes photos attached a second time: the finished run is removed, then queued again', async () => {
    const finished = jobIn('completed');
    queue.getJob.mockResolvedValue(finished);

    await enqueueInventoryImages('u1');

    expect(queue.getJob).toHaveBeenCalledWith('u1-images');
    expect(finished.remove).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith('process-inventory-images', { uploadJobId: 'u1' }, { jobId: 'u1-images' });
  });

  it('does the same after a failed run', async () => {
    const failed = jobIn('failed');
    queue.getJob.mockResolvedValue(failed);
    await enqueueInventoryImages('u1');
    expect(failed.remove).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalled();
  });

  it('leaves a job that is still waiting or running alone, so it is never processed twice at once', async () => {
    for (const state of ['waiting', 'active', 'delayed']) {
      vi.clearAllMocks();
      const alive = jobIn(state);
      queue.getJob.mockResolvedValue(alive);
      await enqueueInventoryImages('u1');
      expect(alive.remove).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    }
  });
});
