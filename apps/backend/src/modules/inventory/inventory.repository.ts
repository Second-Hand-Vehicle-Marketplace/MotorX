import type { Types } from 'mongoose';
import type { VehicleCategory } from '@motorx/shared-contracts';
import { RejectedRecordModel } from './rejectedRecord.model.js';
import { UploadJobModel } from './uploadJob.model.js';

// Creates the durable pending job before it is published to Redis.
export function createUploadJob(input: { dealerId: Types.ObjectId; category: VehicleCategory; fileName: string; fileSize: number; storageKey: string }) { return UploadJobModel.create({ ...input, status: 'pending' }); }

// Lists only upload jobs owned by the authenticated dealer.
export async function listDealerUploadJobs(dealerId: Types.ObjectId, page: number, limit: number) { const filter = { dealerId }; const [documents, total] = await Promise.all([UploadJobModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), UploadJobModel.countDocuments(filter)]); return { documents, total }; }

// Finds one upload only when it belongs to the authenticated dealer.
export function findDealerUploadJob(uploadId: string, dealerId: Types.ObjectId) { return UploadJobModel.findOne({ _id: uploadId, dealerId }).lean(); }

// Removes a pending record during compensation after enqueueing failure.
// Marks a finished CSV upload job as having a photos zip queued for processing. Only allowed once
// the CSV itself has finished, so the zip only ever matches listings that actually got created,
// and never while an earlier zip is still queued or running. A new zip gets a fresh attempt budget.
export function markImageProcessingPending(uploadId: string, dealerId: Types.ObjectId, input: { fileName: string; storageKey: string }) {
  return UploadJobModel.findOneAndUpdate(
    { _id: uploadId, dealerId, status: { $in: ['completed', 'completedWithErrors'] }, imageProcessingStatus: { $nin: ['pending', 'processing'] } },
    { $set: { imageProcessingStatus: 'pending', imageZipFileName: input.fileName, imageZipStorageKey: input.storageKey, imagesAttached: 0, matchedListings: 0, unmatchedFolders: [], imageAttemptCount: 0 }, $unset: { imageFailureReason: 1 } },
    { new: true },
  );
}

// Controlled retry of a failed CSV import: back to pending with a fresh attempt budget. Safe
// because processing resumes from its last checkpoint and never imports the same row twice.
export function resetFailedUploadJob(uploadId: string, dealerId: Types.ObjectId) {
  return UploadJobModel.findOneAndUpdate(
    { _id: uploadId, dealerId, status: 'failed' },
    { $set: { status: 'pending', attemptCount: 0 }, $unset: { failureReason: 1, completedAt: 1, leaseExpiresAt: 1, leaseOwner: 1 } },
    { new: true },
  );
}

// Controlled retry of failed photo processing for the zip already stored with this upload.
export function resetFailedImageProcessing(uploadId: string, dealerId: Types.ObjectId) {
  return UploadJobModel.findOneAndUpdate(
    { _id: uploadId, dealerId, imageProcessingStatus: 'failed', imageZipStorageKey: { $exists: true } },
    { $set: { imageProcessingStatus: 'pending', imageAttemptCount: 0 }, $unset: { imageFailureReason: 1, imageCompletedAt: 1, leaseExpiresAt: 1, leaseOwner: 1 } },
    { new: true },
  );
}

// Lists rejected rows for one upload job, most recent CSV row first.
export async function listRejectedRecordsForUpload(uploadJobId: string, page: number, limit: number) { const filter = { uploadJobId }; const [documents, total] = await Promise.all([RejectedRecordModel.find(filter).sort({ rowNumber: 1 }).skip((page - 1) * limit).limit(limit).lean(), RejectedRecordModel.countDocuments(filter)]); return { documents, total }; }
