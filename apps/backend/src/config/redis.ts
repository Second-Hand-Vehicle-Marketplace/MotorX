import * as RedisModule from 'ioredis';
import { Queue } from 'bullmq';

export const redisConfig = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  queueName: process.env.INVENTORY_QUEUE_NAME ?? 'inventory-processing',
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
} as const;

const RedisCtor = (RedisModule as any).default ?? RedisModule;

export const redisConnection = new RedisCtor(redisConfig.url, {
  maxRetriesPerRequest: 3,
});

export const uploadQueue = new Queue(redisConfig.queueName, {
  connection: redisConnection,
});

export async function closeRedis(): Promise<void> {
  await redisConnection.quit();
}
