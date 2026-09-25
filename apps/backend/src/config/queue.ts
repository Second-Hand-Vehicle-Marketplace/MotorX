import { Queue } from 'bullmq';
import { INVENTORY_JOB_OPTIONS } from '@motorx/shared-contracts';
import { env } from './env.js';

const redisUrl = new URL(env.REDIS_URL);

// Reuses one BullMQ producer for all accepted inventory uploads.
export const inventoryQueue = new Queue(env.INVENTORY_QUEUE_NAME, {
  connection: {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    ...(redisUrl.username ? { username: decodeURIComponent(redisUrl.username) } : {}),
    ...(redisUrl.password ? { password: decodeURIComponent(redisUrl.password) } : {}),
    ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {}),
  },
  defaultJobOptions: { ...INVENTORY_JOB_OPTIONS, backoff: { ...INVENTORY_JOB_OPTIONS.backoff } },
});

// Closes the Redis producer during graceful backend shutdown.
export async function closeInventoryQueue() { await inventoryQueue.close(); }
