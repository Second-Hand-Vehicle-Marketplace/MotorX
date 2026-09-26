import { inventoryBullJobId } from '@motorx/shared-contracts';
import { inventoryQueue } from '../../config/queue.js';

// Job states in which the queue will still run the job, so it must not be replaced.
const ALIVE_STATES = new Set(['waiting', 'delayed', 'active', 'waiting-children', 'prioritized']);

// Adds a job under its fixed ID. BullMQ keeps finished jobs for a while and silently ignores a new
// job with the same ID, so a dealer attaching photos to the same upload a second time (or retrying)
// would never be processed. A finished job is removed first; a job still waiting or running is
// left alone. The ID stays fixed because the worker's reaper finds jobs by it (same rule as there).
async function addUnderFixedId(name: string, uploadJobId: string, bullJobId: string) {
  const existing = await inventoryQueue.getJob(bullJobId);
  if (existing) {
    if (ALIVE_STATES.has(await existing.getState())) return;
    try { await existing.remove(); } catch { return; } // it just became active: that run will do the work
  }
  await inventoryQueue.add(name, { uploadJobId }, { jobId: bullJobId });
}

// Publishes only the durable MongoDB job ID, keeping CSV content out of Redis.
export function enqueueInventoryUpload(uploadJobId: string) { return addUnderFixedId('process-inventory', uploadJobId, inventoryBullJobId.csv(uploadJobId)); }

// The photo stage of the same upload, under its own suffixed ID so it never collides with the CSV job.
export function enqueueInventoryImages(uploadJobId: string) { return addUnderFixedId('process-inventory-images', uploadJobId, inventoryBullJobId.images(uploadJobId)); }
