import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import { workerStorageClient, workerStorageConfig } from '../config/storage.js';
import { findDealersWithExpiredDocuments, markDealerDocumentsDeleted } from '../repositories/dealerDocument.repository.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

// Deletes dealer verification documents (ID cards, business registrations) once the review
// decision is older than DEALER_DOCUMENT_RETENTION_DAYS. Files are removed from storage first;
// the database record is cleared only when every file of that dealer is gone, so a storage
// failure is simply retried on the next cycle. S3 deletes are idempotent, so retries are safe.
export async function runDocumentRetention(now = new Date()) {
  const cutoff = new Date(now.getTime() - env.DEALER_DOCUMENT_RETENTION_DAYS * DAY_MS);
  const dealers = await findDealersWithExpiredDocuments(cutoff, BATCH_SIZE);
  let deletedApplications = 0;
  let failedApplications = 0;

  for (const dealer of dealers) {
    try {
      for (const document of dealer.verificationDocuments) {
        await workerStorageClient.send(new DeleteObjectCommand({ Bucket: workerStorageConfig.bucket, Key: document.key }));
      }
      await markDealerDocumentsDeleted(dealer._id, now);
      deletedApplications += 1;
    } catch (error) {
      failedApplications += 1;
      console.error('Dealer document retention failed; will retry next cycle.', { dealerId: String(dealer._id), message: error instanceof Error ? error.message : String(error) });
    }
  }

  if (deletedApplications || failedApplications) console.log('Dealer document retention cycle finished.', { deletedApplications, failedApplications });
  return { deletedApplications, failedApplications };
}
