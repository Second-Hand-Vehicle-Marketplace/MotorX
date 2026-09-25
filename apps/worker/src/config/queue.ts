import { Queue } from 'bullmq';
import { INVENTORY_JOB_OPTIONS } from '@motorx/shared-contracts';
import { env } from './env.js';
import { redisConnection } from './redis.js';

// A producer client so the lease reaper can re-enqueue jobs abandoned by a crashed worker,
// reusing the same Redis connection and queue name the consumer side already uses. Re-enqueued
// jobs get the same retry/backoff policy as the backend's original enqueue.
export const inventoryQueueProducer = new Queue(env.INVENTORY_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: { ...INVENTORY_JOB_OPTIONS, backoff: { ...INVENTORY_JOB_OPTIONS.backoff } },
});
