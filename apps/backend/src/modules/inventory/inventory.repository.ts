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
export function deletePendingUploadJob(uploadId: string, dealerId: Types.ObjectId) { return UploadJobModel.deleteOne({ _id: uploadId, dealerId, status: 'pending' }); }

// Marks a finished CSV upload job as having a photos zip queued for processing. Only allowed once
// the CSV itself has finished, so the zip only ever matches listings that actually got created.
export function markImageProcessingPending(uploadId: string, dealerId: Types.ObjectId, input: { fileName: string; storageKey: string }) {
  return UploadJobModel.findOneAndUpdate(
    { _id: uploadId, dealerId, status: { $in: ['completed', 'completedWithErrors'] } },
    { $set: { imageProcessingStatus: 'pending', imageZipFileName: input.fileName, imageZipStorageKey: input.storageKey, imagesAttached: 0, matchedListings: 0, unmatchedFolders: [] }, $unset: { imageFailureReason: 1 } },
    { new: true },
  );
}

// Reverts a queued image-processing marker when enqueueing to Redis fails.
export function resetImageProcessing(uploadId: string, dealerId: Types.ObjectId) {
  return UploadJobModel.updateOne({ _id: uploadId, dealerId }, { $set: { imageProcessingStatus: 'none' }, $unset: { imageZipFileName: 1, imageZipStorageKey: 1 } });
}

// Lists rejected rows for one upload job, most recent CSV row first.
export async function listRejectedRecordsForUpload(uploadJobId: string, page: number, limit: number) { const filter = { uploadJobId }; const [documents, total] = await Promise.all([RejectedRecordModel.find(filter).sort({ rowNumber: 1 }).skip((page - 1) * limit).limit(limit).lean(), RejectedRecordModel.countDocuments(filter)]); return { documents, total }; }
