import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

// Reuses one private S3-compatible client for original inventory downloads.
export const workerStorageClient = new S3Client({ endpoint: env.S3_ENDPOINT, region: env.S3_REGION, forcePathStyle: env.S3_FORCE_PATH_STYLE, credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY } });

export const workerStorageConfig = { bucket: env.S3_BUCKET } as const;
