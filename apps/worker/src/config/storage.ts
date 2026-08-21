import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

// Reuses one private S3-compatible client for original inventory downloads.
export const workerStorageClient = new S3Client({ endpoint: env.S3_ENDPOINT, region: env.S3_REGION, forcePathStyle: env.S3_FORCE_PATH_STYLE, credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY } });

// Maps a zip entry's file extension to its S3 Content-Type, restricted to configured image types.
const extensionToMimeType: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const allowedMimeTypes = new Set(env.ALLOWED_IMAGE_TYPES);

export const workerStorageConfig = {
  bucket: env.S3_BUCKET,
  publicUrl: env.S3_PUBLIC_URL.replace(/\/$/, ''),
  maxListingImages: env.MAX_LISTING_IMAGES,
  maxImageBytes: env.MAX_IMAGE_SIZE_MB * 1024 * 1024,
  mimeTypeForExtension(extension: string): string | undefined {
    const mimeType = extensionToMimeType[extension.toLowerCase()];
    return mimeType && allowedMimeTypes.has(mimeType) ? mimeType : undefined;
  },
} as const;
