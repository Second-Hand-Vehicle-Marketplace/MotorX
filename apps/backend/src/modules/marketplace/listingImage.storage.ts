import type { Readable } from 'node:stream';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { LISTING_IMAGE_OBJECT_PREFIX } from '@motorx/shared-contracts';
import { storageClient, storageConfig } from '../../config/storage.js';

// Listing photos live under their own prefix, separate from private objects (dealer documents,
// inventory CSVs and zips). That lets a CDN be granted read access to this prefix only.
// The public image key (used in URLs and on the listing) stays the bare file name.
export const listingImageObjectKey = (key: string) => `${LISTING_IMAGE_OBJECT_PREFIX}${key}`;

// Uploads one re-encoded image and returns its public URL. Behind a CDN, S3_PUBLIC_URL is the
// CDN address (origin path = the prefix); locally it is this API's /listing-images route.
export async function uploadListingImage(key: string, body: Buffer, contentType: string): Promise<string> {
  await storageClient.send(new PutObjectCommand({
    Bucket: storageConfig.bucket,
    Key: listingImageObjectKey(key),
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${storageConfig.publicUrl}/${encodeURIComponent(key)}`;
}

const isNoSuchKey = (error: unknown) => typeof error === 'object' && error !== null && 'name' in error && (error.name === 'NoSuchKey' || error.name === 'NotFound');
const isNotModified = (error: unknown) => typeof error === 'object' && error !== null && '$metadata' in error && (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 304;

export type ListingImageObject =
  | { notModified: true }
  | { notModified: false; body: Readable; contentType: string; cacheControl: string; etag?: string; contentLength?: number };

// Opens one listing image as a stream (never buffered in full). Photos stored before the prefix
// existed are read from their old location until the migration script has moved them.
// Passing the browser's If-None-Match lets storage answer "not modified" without sending bytes.
export async function getListingImageObject(key: string, ifNoneMatch?: string): Promise<ListingImageObject> {
  for (const objectKey of [listingImageObjectKey(key), key]) {
    try {
      const object = await storageClient.send(new GetObjectCommand({ Bucket: storageConfig.bucket, Key: objectKey, ...(ifNoneMatch ? { IfNoneMatch: ifNoneMatch } : {}) }));
      if (!object.Body) throw new Error('The listing image has no content.');
      return {
        notModified: false,
        body: object.Body as Readable,
        contentType: object.ContentType ?? 'application/octet-stream',
        cacheControl: object.CacheControl ?? 'public, max-age=31536000, immutable',
        etag: object.ETag,
        contentLength: object.ContentLength,
      };
    } catch (error) {
      if (isNotModified(error)) return { notModified: true };
      if (!isNoSuchKey(error) || objectKey === key) throw error;
    }
  }
  throw Object.assign(new Error('The listing image was not found.'), { name: 'NoSuchKey' });
}

// Removes one listing image, wherever it is stored (current prefix or the pre-migration location).
export async function deleteListingImageObject(key: string): Promise<void> {
  await Promise.all([listingImageObjectKey(key), key].map((objectKey) => storageClient.send(new DeleteObjectCommand({ Bucket: storageConfig.bucket, Key: objectKey }))));
}
