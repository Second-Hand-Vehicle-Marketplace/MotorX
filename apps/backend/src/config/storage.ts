import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { env } from './env.js';

export const storageConfig = {
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  publicEndpoint: process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  region: process.env.S3_REGION ?? 'us-east-1',
  bucket: process.env.S3_BUCKET ?? 'motorx-dev',
  accessKeyId: process.env.S3_ACCESS_KEY ?? 'motorx',
  secretAccessKey: process.env.S3_SECRET_KEY ?? 'motorx123',
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true').toLowerCase() === 'true',
} as const;

export const s3Client = new S3Client({
  region: storageConfig.region,
  endpoint: storageConfig.endpoint,
  forcePathStyle: storageConfig.forcePathStyle,
  credentials: {
    accessKeyId: storageConfig.accessKeyId,
    secretAccessKey: storageConfig.secretAccessKey,
  },
});

export async function ensureStorageBucket(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: storageConfig.bucket }));
    return;
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: storageConfig.bucket }));
  }
}

export async function uploadFileToStorage(key: string, buffer: Buffer, contentType: string): Promise<string> {
  await ensureStorageBucket();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  );

  const baseUrl = storageConfig.endpoint.replace(/\/$/, '');
  return `${baseUrl}/${storageConfig.bucket}/${key}`;
}

export function getStorageUrl(key: string): string {
  const baseUrl = storageConfig.publicEndpoint.replace(/\/$/, '');
  return `${baseUrl}/${storageConfig.bucket}/${key}`;
}

export function toPublicStorageUrl(url: string): string {
  const internalEndpoint = storageConfig.endpoint.replace(/\/$/, '');
  const publicEndpoint = storageConfig.publicEndpoint.replace(/\/$/, '');
  return url.startsWith(`${internalEndpoint}/`) ? `${publicEndpoint}/${url.slice(internalEndpoint.length + 1)}` : url;
}

export const minioConfig = storageConfig;
export const bucketName = storageConfig.bucket;
