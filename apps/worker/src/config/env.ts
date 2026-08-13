import 'dotenv/config';

export const env = {
	MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/motorx',
	REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
	QUEUE_NAME: process.env.INVENTORY_QUEUE_NAME ?? 'inventory-processing',
	CONCURRENCY: Number(process.env.WORKER_CONCURRENCY ?? 2),
	S3_ENDPOINT: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
	S3_REGION: process.env.S3_REGION ?? 'us-east-1',
	S3_BUCKET: process.env.S3_BUCKET ?? 'motorx',
	S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? 'motorx',
	S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? 'motorx123',
} as const;
