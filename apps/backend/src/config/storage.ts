import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

// Reuses one S3-compatible client for MinIO and production object storage.
export const storageClient = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
});

export const storageConfig = {
  bucket: env.S3_BUCKET,
  publicUrl: env.S3_PUBLIC_URL.replace(/\/$/, ''),
  maxImageBytes: env.MAX_IMAGE_SIZE_MB * 1024 * 1024,
  maxListingImages: env.MAX_LISTING_IMAGES,
  allowedImageTypes: new Set(env.ALLOWED_IMAGE_TYPES),
  maxInventoryBytes: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  allowedInventoryTypes: new Set(env.ALLOWED_UPLOAD_TYPES),
  maxImageZipBytes: env.MAX_IMAGE_ZIP_SIZE_MB * 1024 * 1024,
} as const;
