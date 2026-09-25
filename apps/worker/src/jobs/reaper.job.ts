import { inventoryBullJobId } from '@motorx/shared-contracts';
import { env } from '../config/env.js';
import { inventoryQueueProducer } from '../config/queue.js';
import {
  failImageProcessing, failUploadJob, findExpiredLeaseImageJobs, findExpiredLeaseUploadJobs,
  findStalePendingImageJobs, findStalePendingUploadJobs,
} from '../repositories/uploadJob.repository.js';
import { upsertWorkerHeartbeat } from '../repositories/workerHeartbeat.repository.js';

type JobName = 'process-inventory' | 'process-inventory-images';
const ALIVE_STATES = new Set(['waiting', 'delayed', 'active', 'prioritized', 'waiting-children']);

// Makes sure exactly one live queue message exists for a job. A message that is still waiting,
// delayed (backing off), or running is left alone; one that is missing, finished, or exhausted
// is replaced. BullMQ dedups add() by jobId, so the old finished message must be removed first.
export async function ensureQueued(jobName: JobName, bullJobId: string, uploadJobId: string) {
  const existing = await inventoryQueueProducer.getJob(bullJobId);
  if (existing) {
    if (ALIVE_STATES.has(await existing.getState())) return false;
    try { await existing.remove(); } catch { return false; } // became active meanwhile: leave it
  }
  await inventoryQueueProducer.add(jobName, { uploadJobId }, { jobId: bullJobId });
  return true;
}

const exhausted = (attempts: number) => `Could not be processed after ${attempts} attempts. Use "Retry" to try again.`;

// Reconciles MongoDB (the durable source of truth) with the queue:
// 1. Expired leases: the worker holding the job crashed or was killed mid-job.
// 2. Stale pending jobs: the queue message was never written (Redis down or a crash right after
//    the MongoDB insert), was lost, or ran out of BullMQ attempts after temporary failures.
// Either way the job is re-queued, until its durable attempt budget is used up.
export async function runLeaseReaper(now = new Date()) {
  await upsertWorkerHeartbeat();
  const pendingSince = new Date(now.getTime() - env.PENDING_JOB_REENQUEUE_AFTER_MS);

  const [expiredUploads, expiredImages, staleUploads, staleImages] = await Promise.all([
    findExpiredLeaseUploadJobs(now), findExpiredLeaseImageJobs(now),
    findStalePendingUploadJobs(pendingSince), findStalePendingImageJobs(pendingSince),
  ]);

  for (const job of [...expiredUploads, ...staleUploads]) {
    const id = String(job._id);
    if (job.attemptCount >= env.JOB_MAX_RECLAIM_ATTEMPTS) { await failUploadJob(id, exhausted(job.attemptCount)); continue; }
    await ensureQueued('process-inventory', inventoryBullJobId.csv(id), id);
  }

  for (const job of [...expiredImages, ...staleImages]) {
    const id = String(job._id);
    const attempts = (job as { imageAttemptCount?: number }).imageAttemptCount ?? 0;
    if (attempts >= env.JOB_MAX_RECLAIM_ATTEMPTS) { await failImageProcessing(id, exhausted(attempts)); continue; }
    await ensureQueued('process-inventory-images', inventoryBullJobId.images(id), id);
  }
}
