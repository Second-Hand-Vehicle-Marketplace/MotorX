import { randomUUID } from 'node:crypto';
import type { Types } from 'mongoose';
import { buildCsvTemplateContent, csvTemplatesByCategory, type VehicleCategory } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { enqueueInventoryImages, enqueueInventoryUpload } from './inventory.queue.js';
import { logger } from '../../config/logger.js';
import { createUploadJob, findDealerUploadJob, listDealerUploadJobs, listRejectedRecordsForUpload, markImageProcessingPending, resetFailedImageProcessing, resetFailedUploadJob } from './inventory.repository.js';
import { deleteInventoryCsv, deleteInventoryImagesZip, storeInventoryCsv, storeInventoryImagesZip } from './inventory.storage.js';
import type { ListInventoryUploadsQuery, ListRejectedRecordsQuery } from './inventory.validation.js';
import { validateInventoryCsv, validateInventoryImagesZip } from './inventory.validation.js';

// Converts an upload document into the dealer-safe API representation.
function serializeUpload(record: Record<string, any>) {
  return {
    id: String(record._id), dealerId: String(record.dealerId), fileName: record.fileName, fileSize: record.fileSize, category: record.category,
    status: record.status, totalRecords: record.totalRecords, processedRecords: record.processedRecords, validRecords: record.validRecords,
    rejectedRecords: record.rejectedRecords, duplicateRecords: record.duplicateRecords ?? 0, failureReason: record.failureReason ?? null,
    createdAt: record.createdAt, completedAt: record.completedAt ?? null,
    imageProcessingStatus: record.imageProcessingStatus ?? 'none', imageZipFileName: record.imageZipFileName ?? null,
    imagesAttached: record.imagesAttached ?? 0, matchedListings: record.matchedListings ?? 0, unmatchedFolders: record.unmatchedFolders ?? [],
    imageFailureReason: record.imageFailureReason ?? null, imageCompletedAt: record.imageCompletedAt ?? null,
  };
}

// Enqueues promptly when Redis is reachable. A slow or failed enqueue never fails the request: the
// MongoDB job is already durable, and the worker re-queues any job left pending too long.
async function enqueueOrDefer(enqueue: () => Promise<void>, uploadJobId: string) {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([enqueue(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Queue did not respond within 3 seconds.')), 3_000); })]);
  } catch (error) {
    logger.warn({ uploadJobId, message: error instanceof Error ? error.message : String(error) }, 'Enqueue deferred; the worker reconciler will queue this job.');
  } finally { clearTimeout(timer); }
}

// Converts a rejected-record document into the dealer-safe API representation.
function serializeRejectedRecord(record: Record<string, any>) { return { id: String(record._id), uploadJobId: String(record.uploadJobId), rowNumber: record.rowNumber, originalData: record.originalData, errors: record.errors, reason: record.reason, createdAt: record.createdAt }; }

// Stores, records, and enqueues one accepted CSV. Once the MongoDB job exists the upload is
// accepted: if Redis is unavailable the job simply stays pending and the worker's reconciler
// queues it later, instead of the upload being thrown away.
export async function createInventoryUpload(dealerId: Types.ObjectId, category: VehicleCategory, file: Express.Multer.File) {
  const validation = validateInventoryCsv(file, category);
  if (!validation.valid) throw new AppError(400, errorCodes.validation, validation.message);
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `inventory/${dealerId}/${randomUUID()}-${safeName}`;
  await storeInventoryCsv(storageKey, file);
  let job;
  try { job = await createUploadJob({ dealerId, category, fileName: file.originalname, fileSize: file.size, storageKey }); }
  catch (error) { await Promise.allSettled([deleteInventoryCsv(storageKey)]); throw error; }
  await enqueueOrDefer(() => enqueueInventoryUpload(job._id.toString()), job._id.toString());
  return serializeUpload(job.toObject() as Record<string, any>);
}

// Renders a downloadable CSV template (headers + example rows) for the given category.
export function getInventoryCsvTemplate(category: VehicleCategory) {
  const template = csvTemplatesByCategory[category];
  if (!template) throw new AppError(404, errorCodes.notFound, `No CSV template is available for category "${category}".`);
  return { fileName: `motorx-${category}-template.csv`, content: buildCsvTemplateContent(template) };
}

// Stores a vehicle-photos zip and queues it for matching against this upload job's listings.
// Only allowed once the CSV itself has finished (completed/completedWithErrors) — the zip is
// matched only against listings this exact job actually created.
export async function attachInventoryImagesZip(dealerId: Types.ObjectId, uploadId: string, file: Express.Multer.File) {
  const validation = validateInventoryImagesZip(file);
  if (!validation.valid) throw new AppError(400, errorCodes.validation, validation.message);
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `inventory/${dealerId}/${uploadId}/${randomUUID()}-${safeName}`;
  await storeInventoryImagesZip(storageKey, file);
  let job;
  try {
    job = await markImageProcessingPending(uploadId, dealerId, { fileName: file.originalname, storageKey });
    if (!job) throw new AppError(409, errorCodes.conflict, 'Vehicle photos can only be attached once the CSV upload has finished processing, and not while earlier photos are still being processed.');
  } catch (error) { await Promise.allSettled([deleteInventoryImagesZip(storageKey)]); throw error; }
  await enqueueOrDefer(() => enqueueInventoryImages(uploadId), uploadId);
  return serializeUpload(job.toObject() as Record<string, any>);
}

// Controlled retry of a failed CSV import, owned by this dealer.
export async function retryDealerUpload(dealerId: Types.ObjectId, uploadId: string) {
  const job = await resetFailedUploadJob(uploadId, dealerId);
  if (!job) throw new AppError(409, errorCodes.conflict, 'Only a failed upload can be retried.');
  await enqueueOrDefer(() => enqueueInventoryUpload(uploadId), uploadId);
  return serializeUpload(job.toObject() as Record<string, any>);
}

// Controlled retry of failed photo processing for this dealer's already uploaded zip.
export async function retryDealerUploadImages(dealerId: Types.ObjectId, uploadId: string) {
  const job = await resetFailedImageProcessing(uploadId, dealerId);
  if (!job) throw new AppError(409, errorCodes.conflict, 'Only failed photo processing can be retried.');
  await enqueueOrDefer(() => enqueueInventoryImages(uploadId), uploadId);
  return serializeUpload(job.toObject() as Record<string, any>);
}

// Returns the authenticated dealer's upload history with pagination inside data.
export async function getDealerUploads(dealerId: Types.ObjectId, query: ListInventoryUploadsQuery) { const result = await listDealerUploadJobs(dealerId, query.page, query.limit); return { uploads: result.documents.map((item) => serializeUpload(item as Record<string, any>)), pagination: buildPaginationMeta(query.page, query.limit, result.total) }; }

// Returns one dealer-owned upload or a non-disclosing not-found response.
export async function getDealerUpload(dealerId: Types.ObjectId, uploadId: string) { const job = await findDealerUploadJob(uploadId, dealerId); if (!job) throw new AppError(404, errorCodes.notFound, 'The inventory upload was not found.'); return serializeUpload(job as Record<string, any>); }

// Returns the rejected rows for one dealer-owned upload, verifying ownership first.
export async function getDealerUploadRejectedRecords(dealerId: Types.ObjectId, uploadId: string, query: ListRejectedRecordsQuery) {
  const job = await findDealerUploadJob(uploadId, dealerId);
  if (!job) throw new AppError(404, errorCodes.notFound, 'The inventory upload was not found.');
  const result = await listRejectedRecordsForUpload(uploadId, query.page, query.limit);
  return { records: result.documents.map((item) => serializeRejectedRecord(item as Record<string, any>)), pagination: buildPaginationMeta(query.page, query.limit, result.total) };
}
