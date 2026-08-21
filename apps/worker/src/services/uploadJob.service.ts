import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import type { VehicleCategory } from '@motorx/shared-contracts';
import { env } from '../config/env.js';
import { Types } from 'mongoose';
import { workerStorageClient, workerStorageConfig } from '../config/storage.js';
import { extractCsvBatches, type ExtractedInventoryRow } from '../pipeline/extract.js';
import { detectExactDuplicates } from '../pipeline/detectDuplicates.js';
import { persistRejectedRows, persistValidRows } from '../pipeline/persist.js';
import { prepareInventoryBatch } from '../pipeline/transform.js';
import { claimPendingUploadJob, completeUploadJob, failUploadJob, updateUploadProgress } from '../repositories/uploadJob.repository.js';
import { notifyUploadHighRejectionRate, notifyUploadJobResult } from './notification.service.js';

// A CSV job is flagged to admins as advisory-only once at least a fifth of its records reject.
const HIGH_REJECTION_RATE_THRESHOLD = 0.2;

// Downloads the private original CSV as a Node stream for bounded-memory parsing.
async function downloadInventoryStream(storageKey: string) {
  const object = await workerStorageClient.send(new GetObjectCommand({ Bucket: workerStorageConfig.bucket, Key: storageKey }));
  if (!object.Body || typeof (object.Body as Readable).pipe !== 'function') throw new Error('The stored inventory file is unavailable or not streamable.');
  return object.Body as Readable;
}

interface ProcessingCounts { processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number }

// Transforms and persists one batch before advancing durable progress counters.
async function processInventoryBatch(uploadJobId: string, dealerId: Types.ObjectId, category: VehicleCategory, rows: ExtractedInventoryRow[], processedRecords: number, counts: ProcessingCounts, seenKeys: Set<string>) {
  const firstRowNumber = processedRecords - rows.length + 2;
  const prepared = prepareInventoryBatch(category, rows, firstRowNumber);
  const duplicateResult = await detectExactDuplicates(prepared.valid, seenKeys);
  const rejected = [
    ...prepared.invalid.map((row) => ({ uploadJobId: new Types.ObjectId(uploadJobId), rowNumber: row.rowNumber, originalData: row.originalData, errors: row.errors, reason: 'validation' as const })),
    ...duplicateResult.duplicates.map((row) => ({ uploadJobId: new Types.ObjectId(uploadJobId), rowNumber: row.rowNumber, originalData: row.originalData, errors: ['An exact matching listing already exists.'], reason: 'duplicate' as const })),
  ];
  await Promise.all([persistValidRows(dealerId, new Types.ObjectId(uploadJobId), duplicateResult.unique.map((row) => row.data)), persistRejectedRows(rejected)]);
  counts.processedRecords = processedRecords; counts.validRecords += duplicateResult.unique.length;
  counts.rejectedRecords += prepared.invalid.length; counts.duplicateRecords += duplicateResult.duplicates.length;
  await updateUploadProgress(uploadJobId, counts);
}

// Claims, downloads, and extracts one upload while recording failures on the durable job.
export async function extractInventoryUpload(uploadJobId: string) {
  const upload = await claimPendingUploadJob(uploadJobId);
  if (!upload) throw new Error('The upload job is missing or is not pending.');
  const dealerId = (upload as unknown as { dealerId: Types.ObjectId }).dealerId;
  try {
    const claimedUpload = upload as unknown as { storageKey: string; dealerId: Types.ObjectId; category: VehicleCategory };
    const stream = await downloadInventoryStream(claimedUpload.storageKey);
    const counts: ProcessingCounts = { processedRecords: 0, validRecords: 0, rejectedRecords: 0, duplicateRecords: 0 };
    const seenKeys = new Set<string>();
    await extractCsvBatches(stream, env.ETL_BATCH_SIZE, (rows, processed) => processInventoryBatch(uploadJobId, claimedUpload.dealerId, claimedUpload.category, rows, processed, counts, seenKeys));
    await completeUploadJob(uploadJobId, counts);
    const status = counts.rejectedRecords > 0 || counts.duplicateRecords > 0 ? 'completedWithErrors' as const : 'completed' as const;
    await notifyUploadJobResult(dealerId, uploadJobId, status, counts);
    const rejectionRate = counts.processedRecords > 0 ? (counts.rejectedRecords + counts.duplicateRecords) / counts.processedRecords : 0;
    if (rejectionRate >= HIGH_REJECTION_RATE_THRESHOLD) await notifyUploadHighRejectionRate(uploadJobId, rejectionRate);
    return { uploadJobId, ...counts, stage: 'completed' as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown extraction failure.';
    await failUploadJob(uploadJobId, message);
    await notifyUploadJobResult(dealerId, uploadJobId, 'failed', undefined, message);
    throw error;
  }
}
