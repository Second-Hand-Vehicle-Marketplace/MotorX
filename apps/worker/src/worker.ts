import { Worker } from 'bullmq';
import { connectWorkerDatabase, disconnectWorkerDatabase } from './config/database.js';
import { env } from './config/env.js';
import { disconnectWorkerRedis, redisConnection } from './config/redis.js';
import { processInventoryUploadJob } from './jobs/inventoryUpload.job.js';

// Opens durable dependencies before the worker begins consuming queue messages.
async function startWorker() {
  await connectWorkerDatabase();
  const worker = new Worker(env.INVENTORY_QUEUE_NAME, processInventoryUploadJob, { connection: redisConnection, concurrency: env.WORKER_CONCURRENCY });

  // Emits concise lifecycle events for operational diagnosis.
  worker.on('completed', (job, result) => console.log('Inventory extraction completed.', { bullJobId: job.id, result }));
  worker.on('failed', (job, error) => console.error('Inventory extraction failed.', { bullJobId: job?.id, message: error.message }));
  worker.on('error', (error) => console.error('Inventory worker error.', error));

  let shuttingDown = false;
  // Stops queue intake before closing shared Redis and MongoDB connections.
  const shutdown = async (signal: string) => {
    if (shuttingDown) return; shuttingDown = true;
    console.log(`Received ${signal}. Shutting down inventory worker.`);
    await worker.close();
    await Promise.all([disconnectWorkerDatabase(), disconnectWorkerRedis()]);
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  console.log('MotorX inventory worker is consuming jobs.');
}

// Fails startup loudly so orchestration can restart an unhealthy worker.
void startWorker().catch((error) => { console.error('MotorX worker startup failed.', error); process.exit(1); });
