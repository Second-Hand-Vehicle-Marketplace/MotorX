import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { storageClient, storageConfig } from '../../config/storage.js';

const extensions: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export interface StoredDealerDocument {
  category: 'businessRegistration' | 'identityProof' | 'additionalDocument';
  key: string;
  originalName: string;
  contentType: string;
  size: number;
}

export async function storeDealerDocuments(userId: string, files: Array<{ category: StoredDealerDocument['category']; file: Express.Multer.File }>): Promise<StoredDealerDocument[]> {
  const stored: StoredDealerDocument[] = [];
  try {
    for (const { category, file } of files) {
      const key = `dealer-verification/${userId}/${randomUUID()}.${extensions[file.mimetype]}`;
      await storageClient.send(new PutObjectCommand({
        Bucket: storageConfig.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
      stored.push({ category, key, originalName: file.originalname, contentType: file.mimetype, size: file.size });
    }
    return stored;
  } catch (error) {
    await deleteDealerDocuments(stored);
    throw error;
  }
}

export async function deleteDealerDocuments(documents: StoredDealerDocument[]): Promise<void> {
  await Promise.allSettled(documents.map((document) => storageClient.send(new DeleteObjectCommand({
    Bucket: storageConfig.bucket,
    Key: document.key,
  }))));
}

export async function readDealerDocument(key: string) {
  const object = await storageClient.send(new GetObjectCommand({ Bucket: storageConfig.bucket, Key: key }));
  if (!object.Body) throw new Error('The dealer verification document has no content.');
  return {
    bytes: Buffer.from(await object.Body.transformToByteArray()),
    contentType: object.ContentType ?? 'application/octet-stream',
  };
}
