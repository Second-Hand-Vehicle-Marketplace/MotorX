import { Queue } from 'bullmq';
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
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2_000 }, removeOnComplete: 500, removeOnFail: 1_000 },
});

// Closes the Redis producer during graceful backend shutdown.
export async function closeInventoryQueue() { await inventoryQueue.close(); }
