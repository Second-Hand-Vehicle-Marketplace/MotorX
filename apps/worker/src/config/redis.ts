import { Redis } from 'ioredis';
import { env } from './env.js';

// BullMQ requires unlimited request retries for long-running blocking commands.
export const redisConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

// Releases the worker's shared Redis connection during graceful shutdown.
export async function disconnectWorkerRedis() { await redisConnection.quit(); }
