import { GetObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import type { VehicleCategory } from '@motorx/shared-contracts';
import { env } from '../config/env.js';
import { Types } from 'mongoose';
import { workerStorageClient, workerStorageConfig } from '../config/storage.js';
import { extractCsvBatches, type ExtractedInventoryRow } from '../pipeline/extract.js';
import { createListingDuplicateKey, detectExactDuplicates } from '../pipeline/detectDuplicates.js';
import { persistRejectedRows, persistValidRows } from '../pipeline/persist.js';
import { prepareInventoryBatch } from '../pipeline/transform.js';
import { findImportedRowNumbers } from '../repositories/listing.repository.js';
import { claimPendingUploadJob, completeUploadJob, failUploadJob, renewUploadLease, retryUploadJob, updateUploadProgress, type ProcessingCounts } from '../repositories/uploadJob.repository.js';
import { trackLease, untrackLease } from './activeLeases.js';
import { holdLease, LeaseLostError, type HeldLease } from './jobLease.js';
import { notifyUploadHighRejectionRate, notifyUploadJobResult } from './notification.service.js';
import { isTransientError } from './transientError.js';

// A CSV job is flagged to admins as advisory-only once at least a fifth of its records reject.
const HIGH_REJECTION_RATE_THRESHOLD = 0.2;

// Downloads the private original CSV as a Node stream for bounded-memory parsing.
async function downloadInventoryStream(storageKey: string) {
  const object = await workerStorageClient.send(new GetObjectCommand({ Bucket: workerStorageConfig.bucket, Key: storageKey }));
  if (!object.Body || typeof (object.Body as Readable).pipe !== 'function') throw new Error('The stored inventory file is unavailable or not streamable.');
  return object.Body as Readable;
}

// Transforms and persists one batch, then checkpoints the cumulative counters. Safe to run
// again for the same rows: rows an earlier attempt already imported are counted, not re-inserted,
// and rejected rows are insert-once.
async function processInventoryBatch(uploadJobId: string, lease: HeldLease, dealerId: Types.ObjectId, category: VehicleCategory, rows: ExtractedInventoryRow[], processedRecords: number, counts: ProcessingCounts, seenKeys: Set<string>) {
  lease.assertHeld();
  const jobObjectId = new Types.ObjectId(uploadJobId);
  const firstRowNumber = processedRecords - rows.length + 2;
  const prepared = prepareInventoryBatch(category, rows, firstRowNumber);

  const alreadyImported = await findImportedRowNumbers(jobObjectId, prepared.valid.map((row) => row.rowNumber));
  const resumed = prepared.valid.filter((row) => alreadyImported.has(row.rowNumber));
  for (const row of resumed) seenKeys.add(createListingDuplicateKey(row.data));
  const duplicateResult = await detectExactDuplicates(prepared.valid.filter((row) => !alreadyImported.has(row.rowNumber)), seenKeys);

  const rejected = [
    ...prepared.invalid.map((row) => ({ uploadJobId: jobObjectId, rowNumber: row.rowNumber, originalData: row.originalData, errors: row.errors, reason: 'validation' as const })),
    ...duplicateResult.duplicates.map((row) => ({ uploadJobId: jobObjectId, rowNumber: row.rowNumber, originalData: row.originalData, errors: ['An exact matching listing already exists.'], reason: 'duplicate' as const })),
  ];
  await Promise.all([persistValidRows(dealerId, jobObjectId, duplicateResult.unique), persistRejectedRows(rejected)]);
  counts.processedRecords = processedRecords; counts.validRecords += duplicateResult.unique.length + resumed.length;
  counts.rejectedRecords += prepared.invalid.length; counts.duplicateRecords += duplicateResult.duplicates.length;
  if (!(await updateUploadProgress(uploadJobId, lease.owner, counts))) throw new LeaseLostError(uploadJobId);
}

// Claims, downloads, and extracts one upload. A retry resumes after the last checkpoint.
// Temporary failures hand the job back as pending (BullMQ retries it with backoff); permanent
// ones, or running out of attempts, fail it and tell the dealer.
export async function extractInventoryUpload(uploadJobId: string) {
  const owner = randomUUID();
  const upload = await claimPendingUploadJob(uploadJobId, owner);
  if (!upload) {
    // Already claimed, already terminal, or its lease is still legitimately held by another
    // attempt — nothing for this BullMQ attempt to do. Recovery of a genuinely stuck job is the
    // lease reaper's job (apps/worker/src/jobs/reaper.job.ts).
    console.warn('Upload job claim missed; already claimed, terminal, or lease still active.', { uploadJobId });
    return { uploadJobId, stage: 'skipped' as const };
  }
  const claimed = upload as unknown as { storageKey: string; dealerId: Types.ObjectId; category: VehicleCategory; attemptCount: number } & ProcessingCounts;
  const dealerId = claimed.dealerId;
  const lease = holdLease(uploadJobId, owner, renewUploadLease);
  trackLease(uploadJobId, 'csv', owner);
  try {
    // Resume from the last checkpoint written by an earlier attempt (all zeros on a first attempt).
    const counts: ProcessingCounts = { processedRecords: claimed.processedRecords ?? 0, validRecords: claimed.validRecords ?? 0, rejectedRecords: claimed.rejectedRecords ?? 0, duplicateRecords: claimed.duplicateRecords ?? 0 };
    const stream = await downloadInventoryStream(claimed.storageKey);
    const seenKeys = new Set<string>();
    await extractCsvBatches(stream, env.ETL_BATCH_SIZE, (rows, processed) => processInventoryBatch(uploadJobId, lease, dealerId, claimed.category, rows, processed, counts, seenKeys), counts.processedRecords);
    lease.assertHeld();
    if (!(await completeUploadJob(uploadJobId, owner, counts))) throw new LeaseLostError(uploadJobId);
    const status = counts.rejectedRecords > 0 || counts.duplicateRecords > 0 ? 'completedWithErrors' as const : 'completed' as const;
    await notifyUploadJobResult(dealerId, uploadJobId, status, counts);
    const rejectionRate = counts.processedRecords > 0 ? (counts.rejectedRecords + counts.duplicateRecords) / counts.processedRecords : 0;
    if (rejectionRate >= HIGH_REJECTION_RATE_THRESHOLD) await notifyUploadHighRejectionRate(uploadJobId, rejectionRate);
    return { uploadJobId, ...counts, stage: 'completed' as const };
  } catch (error) {
    if (error instanceof LeaseLostError) {
      // Another worker owns the job now; it will finish it. Nothing here may touch its state.
      console.warn(error.message);
      return { uploadJobId, stage: 'lease-lost' as const };
    }
    const message = error instanceof Error ? error.message : 'Unknown extraction failure.';
    if (isTransientError(error) && claimed.attemptCount < env.JOB_MAX_RECLAIM_ATTEMPTS) {
      await retryUploadJob(uploadJobId, owner, message);
      throw error; // BullMQ schedules the next attempt with exponential backoff and jitter.
    }
    if (await failUploadJob(uploadJobId, message, owner)) await notifyUploadJobResult(dealerId, uploadJobId, 'failed', undefined, message);
    return { uploadJobId, stage: 'failed' as const, message };
  } finally {
    lease.stop();
    untrackLease(owner);
  }
}
