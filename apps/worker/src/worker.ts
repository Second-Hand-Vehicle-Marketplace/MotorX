import * as RedisModule from 'ioredis';
import { Worker } from 'bullmq';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { processInventoryUpload } from './jobs/inventoryUpload.job.js';

const RedisCtor = (RedisModule as any).default ?? RedisModule;
const redisConnection = new RedisCtor(env.REDIS_URL, { maxRetriesPerRequest: null });

await connectDatabase();

const worker = new Worker(env.QUEUE_NAME, processInventoryUpload, {
  connection: redisConnection,
  concurrency: env.CONCURRENCY,
});

worker.on('ready', () => console.log(`MotorX ETL worker ready on queue ${env.QUEUE_NAME}.`));
worker.on('completed', (job) => console.log(`ETL job ${job.id} completed.`));
worker.on('failed', (job, error) => console.error(`ETL job ${job?.id ?? 'unknown'} failed:`, error.message));

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Shutting down ETL worker.`);
  await worker.close();
  await redisConnection.quit();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
