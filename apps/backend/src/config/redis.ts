import { Redis } from 'ioredis';
import { env } from './env.js';

// Shared Redis client for request-path features (rate limits). Commands issued while it is still
// connecting are queued (the rate-limit store loads its script at startup), but every command has
// a hard 1 s timeout: during a Redis outage these features fail fast (and open) instead of making
// API requests wait.
export const redisClient = new Redis(env.REDIS_URL, {
  commandTimeout: 1_000,
  maxRetriesPerRequest: 1,
  connectTimeout: 2_000,
});

// Without a listener, ioredis reports every reconnect failure as an unhandled error.
redisClient.on('error', () => undefined);

export async function disconnectRedis() { await redisClient.quit().catch(() => redisClient.disconnect()); }
