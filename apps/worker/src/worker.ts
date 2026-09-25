import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { connectWorkerDatabase, disconnectWorkerDatabase } from './config/database.js';
import { env } from './config/env.js';
import { inventoryQueueProducer } from './config/queue.js';
import { disconnectWorkerRedis, redisConnection } from './config/redis.js';
import { startWorkerHealthServer } from './health.js';
import { processInventoryImagesJob } from './jobs/inventoryImages.job.js';
import { processInventoryUploadJob } from './jobs/inventoryUpload.job.js';
import { runLeaseReaper } from './jobs/reaper.job.js';
import { runDocumentRetention } from './jobs/documentRetention.job.js';
import { retryImageProcessing, retryUploadJob } from './repositories/uploadJob.repository.js';
import { listActiveLeases } from './services/activeLeases.js';

// Returns every job this process still holds to pending, using its own lease token so a job
// another worker has already taken over is never touched. Returns how many were released.
async function releaseActiveLeases() {
  const leases = listActiveLeases();
  const results = await Promise.allSettled(leases.map(({ uploadJobId, stage, owner }) => stage === 'csv'
    ? retryUploadJob(uploadJobId, owner, 'Worker shut down before finishing; it will resume automatically.')
    : retryImageProcessing(uploadJobId, owner, 'Worker shut down before finishing; it will resume automatically.')));
  return results.filter((result) => result.status === 'fulfilled' && result.value).length;
}

// Both job types share one queue; this dispatches by name to the right handler.
async function processInventoryJob(job: Job) {
  if (job.name === 'process-inventory') return processInventoryUploadJob(job);
  if (job.name === 'process-inventory-images') return processInventoryImagesJob(job);
  throw new Error(`Unsupported inventory job: ${job.name}`);
}

// Opens durable dependencies before the worker begins consuming queue messages.
async function startWorker() {
  await connectWorkerDatabase();
  const worker = new Worker(env.INVENTORY_QUEUE_NAME, processInventoryJob, { connection: redisConnection, concurrency: env.WORKER_CONCURRENCY });
  const healthServer = startWorkerHealthServer();

  // Recovers jobs whose Mongo lease outlived the worker that claimed them (e.g. a crash
  // mid-job) — BullMQ's own retries exhaust in seconds and can't be relied on for this.
  const reaperTimer = setInterval(() => {
    void runLeaseReaper().catch((error) => console.error('Lease reaper cycle failed.', error));
  }, env.JOB_REAPER_INTERVAL_MS);

  // Deletes verification documents whose retention period has ended (runs once at startup too).
  const runRetention = () => void runDocumentRetention().catch((error) => console.error('Document retention cycle failed.', error));
  runRetention();
  const retentionTimer = setInterval(runRetention, env.DOCUMENT_RETENTION_INTERVAL_MS);

  // Emits concise lifecycle events for operational diagnosis.
  worker.on('completed', (job, result) => console.log('Inventory extraction completed.', { bullJobId: job.id, result }));
  worker.on('failed', (job, error) => console.error('Inventory extraction failed.', { bullJobId: job?.id, message: error.message }));
  worker.on('error', (error) => console.error('Inventory worker error.', error));

  let shuttingDown = false;
  // Stops taking new jobs, gives running jobs until SHUTDOWN_TIMEOUT_MS to finish, then hands any
  // still running back as pending (their progress checkpoints stay, so the next attempt resumes)
  // and exits before the orchestrator's own kill deadline.
  const shutdown = async (signal: string) => {
    if (shuttingDown) return; shuttingDown = true;
    console.log(`Received ${signal}. Shutting down inventory worker (deadline ${env.SHUTDOWN_TIMEOUT_MS} ms).`);
    const hardExit = setTimeout(() => { console.error('Worker shutdown deadline exceeded; exiting.'); process.exit(1); }, env.SHUTDOWN_TIMEOUT_MS + 5_000);
    hardExit.unref();
    clearInterval(reaperTimer);
    clearInterval(retentionTimer);

    let drainTimer: NodeJS.Timeout | undefined;
    const finishedInTime = await Promise.race([
      worker.close().then(() => true),
      new Promise<boolean>((resolve) => { drainTimer = setTimeout(() => resolve(false), env.SHUTDOWN_TIMEOUT_MS); }),
    ]);
    clearTimeout(drainTimer);
    if (!finishedInTime) {
      const released = await releaseActiveLeases();
      console.warn(`Jobs still running at the deadline were handed back for another worker to resume: ${released}.`);
      await Promise.race([worker.close(true), new Promise((resolve) => setTimeout(resolve, 2_000))]);
    }

    const results = await Promise.allSettled([
      inventoryQueueProducer.close(),
      new Promise<void>((resolve) => healthServer.close(() => resolve())),
    ]);
    results.push(...await Promise.allSettled([disconnectWorkerDatabase(), disconnectWorkerRedis()]));
    process.exit(results.some((result) => result.status === 'rejected') ? 1 : 0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  console.log('MotorX inventory worker is consuming jobs.');
}

// Fails startup loudly so orchestration can restart an unhealthy worker.
void startWorker().catch((error) => { console.error('MotorX worker startup failed.', error); process.exit(1); });
