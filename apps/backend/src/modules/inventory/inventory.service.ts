import { randomUUID } from 'node:crypto';
import type { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { enqueueInventoryUpload } from './inventory.queue.js';
import { createUploadJob, deletePendingUploadJob, findDealerUploadJob, listDealerUploadJobs } from './inventory.repository.js';
import { deleteInventoryCsv, storeInventoryCsv } from './inventory.storage.js';
import type { ListInventoryUploadsQuery } from './inventory.validation.js';
import { validateInventoryCsv } from './inventory.validation.js';

// Converts an upload document into the dealer-safe API representation.
function serializeUpload(record: Record<string, any>) { return { id: String(record._id), dealerId: String(record.dealerId), fileName: record.fileName, fileSize: record.fileSize, status: record.status, totalRecords: record.totalRecords, processedRecords: record.processedRecords, validRecords: record.validRecords, rejectedRecords: record.rejectedRecords, duplicateRecords: record.duplicateRecords ?? 0, failureReason: record.failureReason ?? null, createdAt: record.createdAt, completedAt: record.completedAt ?? null }; }

// Stores, records, and enqueues one accepted CSV with compensation on failure.
export async function createInventoryUpload(dealerId: Types.ObjectId, file: Express.Multer.File) {
  const validation = validateInventoryCsv(file);
  if (!validation.valid) throw new AppError(400, errorCodes.validation, validation.message);
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `inventory/${dealerId}/${randomUUID()}-${safeName}`;
  await storeInventoryCsv(storageKey, file);
  let job;
  try { job = await createUploadJob({ dealerId, fileName: file.originalname, fileSize: file.size, storageKey }); }
  catch (error) { await Promise.allSettled([deleteInventoryCsv(storageKey)]); throw error; }
  try { await enqueueInventoryUpload(job._id.toString()); }
  catch (error) { await Promise.allSettled([deletePendingUploadJob(job._id.toString(), dealerId), deleteInventoryCsv(storageKey)]); throw error; }
  return serializeUpload(job.toObject() as Record<string, any>);
}

// Returns the authenticated dealer's upload history with pagination inside data.
export async function getDealerUploads(dealerId: Types.ObjectId, query: ListInventoryUploadsQuery) { const result = await listDealerUploadJobs(dealerId, query.page, query.limit); return { uploads: result.documents.map((item) => serializeUpload(item as Record<string, any>)), pagination: buildPaginationMeta(query.page, query.limit, result.total) }; }

// Returns one dealer-owned upload or a non-disclosing not-found response.
export async function getDealerUpload(dealerId: Types.ObjectId, uploadId: string) { const job = await findDealerUploadJob(uploadId, dealerId); if (!job) throw new AppError(404, errorCodes.notFound, 'The inventory upload was not found.'); return serializeUpload(job as Record<string, any>); }
