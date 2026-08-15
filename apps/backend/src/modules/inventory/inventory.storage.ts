import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { storageClient, storageConfig } from '../../config/storage.js';

// Stores the original private inventory file for worker processing and traceability.
export async function storeInventoryCsv(key: string, file: Express.Multer.File) { await storageClient.send(new PutObjectCommand({ Bucket: storageConfig.bucket, Key: key, Body: file.buffer, ContentType: 'text/csv' })); }

// Removes an uploaded object when job creation or enqueueing cannot complete.
export async function deleteInventoryCsv(key: string) { await storageClient.send(new DeleteObjectCommand({ Bucket: storageConfig.bucket, Key: key })); }
