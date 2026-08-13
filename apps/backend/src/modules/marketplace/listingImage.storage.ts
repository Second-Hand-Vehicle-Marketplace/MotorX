import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { storageClient, storageConfig } from '../../config/storage.js';

// Uploads one validated image and returns its public object URL.
export async function uploadListingImage(key: string, file: Express.Multer.File): Promise<string> {
  await storageClient.send(new PutObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${storageConfig.publicUrl}/${encodeURIComponent(key)}`;
}

// Reads one private image object for controlled delivery through the API.
export async function getListingImageObject(key: string) {
  const object = await storageClient.send(new GetObjectCommand({ Bucket: storageConfig.bucket, Key: key }));
  if (!object.Body) throw new Error('The listing image has no content.');
  return {
    bytes: Buffer.from(await object.Body.transformToByteArray()),
    contentType: object.ContentType ?? 'application/octet-stream',
    cacheControl: object.CacheControl ?? 'public, max-age=31536000, immutable',
  };
}

// Removes one listing image object from S3-compatible storage.
export async function deleteListingImageObject(key: string): Promise<void> {
  await storageClient.send(new DeleteObjectCommand({ Bucket: storageConfig.bucket, Key: key }));
}
