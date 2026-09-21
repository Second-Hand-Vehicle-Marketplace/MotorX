import { randomUUID } from 'node:crypto';
import type { Types } from 'mongoose';
import { buildCsvTemplateContent, csvTemplatesByCategory, type VehicleCategory } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { enqueueInventoryImages, enqueueInventoryUpload } from './inventory.queue.js';
import { createUploadJob, deletePendingUploadJob, findDealerUploadJob, listDealerUploadJobs, listRejectedRecordsForUpload, markImageProcessingPending, resetImageProcessing } from './inventory.repository.js';
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

// Converts a rejected-record document into the dealer-safe API representation.
function serializeRejectedRecord(record: Record<string, any>) { return { id: String(record._id), uploadJobId: String(record.uploadJobId), rowNumber: record.rowNumber, originalData: record.originalData, errors: record.errors, reason: record.reason, createdAt: record.createdAt }; }

// Stores, records, and enqueues one accepted CSV with compensation on failure.
export async function createInventoryUpload(dealerId: Types.ObjectId, category: VehicleCategory, file: Express.Multer.File) {
  const validation = validateInventoryCsv(file, category);
  if (!validation.valid) throw new AppError(400, errorCodes.validation, validation.message);
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `inventory/${dealerId}/${randomUUID()}-${safeName}`;
  await storeInventoryCsv(storageKey, file);
  let job;
  try { job = await createUploadJob({ dealerId, category, fileName: file.originalname, fileSize: file.size, storageKey }); }
  catch (error) { await Promise.allSettled([deleteInventoryCsv(storageKey)]); throw error; }
  try { await enqueueInventoryUpload(job._id.toString()); }
  catch (error) { await Promise.allSettled([deletePendingUploadJob(job._id.toString(), dealerId), deleteInventoryCsv(storageKey)]); throw error; }
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
    if (!job) throw new AppError(409, errorCodes.conflict, 'Vehicle photos can only be attached once the CSV upload has finished processing.');
  } catch (error) { await Promise.allSettled([deleteInventoryImagesZip(storageKey)]); throw error; }
  try { await enqueueInventoryImages(uploadId); }
  catch (error) { await Promise.allSettled([resetImageProcessing(uploadId, dealerId), deleteInventoryImagesZip(storageKey)]); throw error; }
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
