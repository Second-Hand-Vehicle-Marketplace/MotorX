import mongoose, { type Types } from 'mongoose';
import { vehicleCategories, type VehicleCategory } from '@motorx/shared-contracts';

export type ImageProcessingStatus = 'none' | 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';

export interface WorkerUploadJob {
  dealerId: Types.ObjectId; storageKey: string; fileName: string; category: VehicleCategory;
  status: 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';
  totalRecords: number; processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number;
  failureReason?: string; completedAt?: Date;
  imageProcessingStatus: ImageProcessingStatus; imageZipStorageKey?: string;
  imagesAttached: number; matchedListings: number; unmatchedFolders: string[]; imageFailureReason?: string;
}

const schema = new mongoose.Schema<WorkerUploadJob>({
  dealerId: { type: mongoose.Schema.Types.ObjectId, required: true }, storageKey: { type: String, required: true }, fileName: { type: String, required: true },
  category: { type: String, enum: vehicleCategories, required: true }, status: { type: String, required: true },
  totalRecords: { type: Number, default: 0 }, processedRecords: { type: Number, default: 0 }, validRecords: { type: Number, default: 0 },
  rejectedRecords: { type: Number, default: 0 }, duplicateRecords: { type: Number, default: 0 }, failureReason: String, completedAt: Date,
  imageProcessingStatus: { type: String, default: 'none' }, imageZipStorageKey: String,
  imagesAttached: { type: Number, default: 0 }, matchedListings: { type: Number, default: 0 }, unmatchedFolders: { type: [String], default: [] }, imageFailureReason: String,
}, { collection: 'uploadJobs', timestamps: true, versionKey: false });
const UploadJobModel = mongoose.models.UploadJob ?? mongoose.model<WorkerUploadJob>('UploadJob', schema);

// Claims a pending upload atomically so duplicate queue delivery cannot process it twice.
export function claimPendingUploadJob(uploadJobId: string) { return UploadJobModel.findOneAndUpdate({ _id: uploadJobId, status: 'pending' }, { $set: { status: 'processing' }, $unset: { failureReason: 1 } }, { new: true }).lean(); }

// Saves cumulative ETL counters after a batch has been durably persisted.
export function updateUploadProgress(uploadJobId: string, counts: { processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number }) { return UploadJobModel.updateOne({ _id: uploadJobId, status: 'processing' }, { $set: { totalRecords: counts.processedRecords, ...counts } }); }

// Marks a fully processed upload using error-aware terminal status semantics.
export function completeUploadJob(uploadJobId: string, counts: { processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number }) { const status = counts.rejectedRecords > 0 || counts.duplicateRecords > 0 ? 'completedWithErrors' : 'completed'; return UploadJobModel.updateOne({ _id: uploadJobId, status: 'processing' }, { $set: { status, totalRecords: counts.processedRecords, ...counts, completedAt: new Date() }, $unset: { failureReason: 1 } }); }

// Records an actionable terminal failure after parsing or infrastructure errors.
export function failUploadJob(uploadJobId: string, failureReason: string) { return UploadJobModel.updateOne({ _id: uploadJobId }, { $set: { status: 'failed', failureReason: failureReason.slice(0, 1_000), completedAt: new Date() } }); }

// Claims a pending image-processing job atomically, returning the zip's storage key and dealer.
export function claimPendingImageProcessing(uploadJobId: string) { return UploadJobModel.findOneAndUpdate({ _id: uploadJobId, imageProcessingStatus: 'pending' }, { $set: { imageProcessingStatus: 'processing' }, $unset: { imageFailureReason: 1 } }, { new: true }).lean(); }

// Marks image processing complete, recording how many photos were attached and which folders
// in the zip didn't match any listing this upload job created.
export function completeImageProcessing(uploadJobId: string, result: { imagesAttached: number; matchedListings: number; unmatchedFolders: string[] }) {
  const status: ImageProcessingStatus = result.unmatchedFolders.length > 0 ? 'completedWithErrors' : 'completed';
  return UploadJobModel.updateOne({ _id: uploadJobId, imageProcessingStatus: 'processing' }, { $set: { imageProcessingStatus: status, ...result, imageCompletedAt: new Date() }, $unset: { imageFailureReason: 1 } });
}

// Records an actionable terminal failure for image processing.
export function failImageProcessing(uploadJobId: string, failureReason: string) { return UploadJobModel.updateOne({ _id: uploadJobId }, { $set: { imageProcessingStatus: 'failed', imageFailureReason: failureReason.slice(0, 1_000), imageCompletedAt: new Date() } }); }
