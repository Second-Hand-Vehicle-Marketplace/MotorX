import mongoose, { type Types } from 'mongoose';
import { vehicleCategories, type VehicleCategory } from '@motorx/shared-contracts';

export type ImageProcessingStatus = 'none' | 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';

export interface WorkerUploadJob {
  dealerId: Types.ObjectId; storageKey: string; fileName: string; category: VehicleCategory;
  status: 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';
  totalRecords: number; processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number;
  failureReason?: string; completedAt?: Date;
  processingStartedAt?: Date; leaseExpiresAt?: Date; leaseOwner?: string; attemptCount: number;
  imageProcessingStatus: ImageProcessingStatus; imageZipStorageKey?: string; imageAttemptCount: number;
  imagesAttached: number; matchedListings: number; unmatchedFolders: string[]; imageFailureReason?: string;
  updatedAt: Date;
}

const schema = new mongoose.Schema<WorkerUploadJob>({
  dealerId: { type: mongoose.Schema.Types.ObjectId, required: true }, storageKey: { type: String, required: true }, fileName: { type: String, required: true },
  category: { type: String, enum: vehicleCategories, required: true }, status: { type: String, required: true },
  totalRecords: { type: Number, default: 0 }, processedRecords: { type: Number, default: 0 }, validRecords: { type: Number, default: 0 },
  rejectedRecords: { type: Number, default: 0 }, duplicateRecords: { type: Number, default: 0 }, failureReason: String, completedAt: Date,
  processingStartedAt: Date, leaseExpiresAt: Date, leaseOwner: String, attemptCount: { type: Number, default: 0 },
  imageProcessingStatus: { type: String, default: 'none' }, imageZipStorageKey: String, imageAttemptCount: { type: Number, default: 0 },
  imagesAttached: { type: Number, default: 0 }, matchedListings: { type: Number, default: 0 }, unmatchedFolders: { type: [String], default: [] }, imageFailureReason: String,
}, { collection: 'uploadJobs', timestamps: true, versionKey: false });
const UploadJobModel = mongoose.models.UploadJob ?? mongoose.model<WorkerUploadJob>('UploadJob', schema);

// A lease is short and renewed while work continues (see services/jobLease.ts), so a crashed
// worker's job becomes reclaimable within minutes, while a slow but healthy one keeps it.
export const JOB_LEASE_MS = 2 * 60_000;
const leaseUntil = (now = new Date()) => new Date(now.getTime() + JOB_LEASE_MS);

export interface ProcessingCounts { processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number }

// ---------------------------------------------------------------------------------------------
// CSV extraction stage. Every write made while processing requires the caller's lease-owner
// token, so a worker whose lease expired (and was taken over) can no longer change the job.
// ---------------------------------------------------------------------------------------------

// Claims pending work, or work whose lease expired because its worker crashed.
export function claimPendingUploadJob(uploadJobId: string, leaseOwner: string) {
  const now = new Date();
  return UploadJobModel.findOneAndUpdate(
    { _id: uploadJobId, $or: [{ status: 'pending' }, { status: 'processing', leaseExpiresAt: { $lt: now } }] },
    { $set: { status: 'processing', processingStartedAt: now, leaseExpiresAt: leaseUntil(now), leaseOwner }, $inc: { attemptCount: 1 }, $unset: { failureReason: 1 } },
    { new: true },
  ).lean();
}

// Extends the lease while this owner still holds it; false means the job was taken over.
export async function renewUploadLease(uploadJobId: string, leaseOwner: string) {
  const result = await UploadJobModel.updateOne({ _id: uploadJobId, status: 'processing', leaseOwner }, { $set: { leaseExpiresAt: leaseUntil() } });
  return result.matchedCount === 1;
}

// Saves cumulative counters after a batch is durably persisted: the checkpoint a retry resumes from.
export async function updateUploadProgress(uploadJobId: string, leaseOwner: string, counts: ProcessingCounts) {
  const result = await UploadJobModel.updateOne({ _id: uploadJobId, status: 'processing', leaseOwner }, { $set: { totalRecords: counts.processedRecords, ...counts, leaseExpiresAt: leaseUntil() } });
  return result.matchedCount === 1;
}

// Marks a fully processed upload using error-aware terminal status semantics.
export async function completeUploadJob(uploadJobId: string, leaseOwner: string, counts: ProcessingCounts) {
  const status = counts.rejectedRecords > 0 || counts.duplicateRecords > 0 ? 'completedWithErrors' : 'completed';
  const result = await UploadJobModel.updateOne(
    { _id: uploadJobId, status: 'processing', leaseOwner },
    { $set: { status, totalRecords: counts.processedRecords, ...counts, completedAt: new Date() }, $unset: { failureReason: 1, leaseExpiresAt: 1, leaseOwner: 1 } },
  );
  return result.matchedCount === 1;
}

// Records a terminal failure. With a lease owner, only that owner may fail the job; without one
// (the reaper), only a job still in the expected state is changed.
export async function failUploadJob(uploadJobId: string, failureReason: string, leaseOwner?: string) {
  const filter = leaseOwner ? { _id: uploadJobId, status: 'processing', leaseOwner } : { _id: uploadJobId, status: { $in: ['pending', 'processing'] } };
  const result = await UploadJobModel.updateOne(filter, { $set: { status: 'failed', failureReason: failureReason.slice(0, 1_000), completedAt: new Date() }, $unset: { leaseExpiresAt: 1, leaseOwner: 1 } });
  return result.matchedCount === 1;
}

// Hands the job back as pending (temporary failure or shutdown) so a later attempt resumes it.
export async function retryUploadJob(uploadJobId: string, leaseOwner: string, failureReason: string) {
  const result = await UploadJobModel.updateOne(
    { _id: uploadJobId, status: 'processing', leaseOwner },
    { $set: { status: 'pending', failureReason: failureReason.slice(0, 1_000) }, $unset: { processingStartedAt: 1, leaseExpiresAt: 1, leaseOwner: 1 } },
  );
  return result.matchedCount === 1;
}

// ---------------------------------------------------------------------------------------------
// Image stage: same lease rules, with its own attempt counter.
// ---------------------------------------------------------------------------------------------

export function claimPendingImageProcessing(uploadJobId: string, leaseOwner: string) {
  const now = new Date();
  return UploadJobModel.findOneAndUpdate(
    { _id: uploadJobId, $or: [{ imageProcessingStatus: 'pending' }, { imageProcessingStatus: 'processing', leaseExpiresAt: { $lt: now } }] },
    { $set: { imageProcessingStatus: 'processing', processingStartedAt: now, leaseExpiresAt: leaseUntil(now), leaseOwner }, $inc: { imageAttemptCount: 1 }, $unset: { imageFailureReason: 1 } },
    { new: true },
  ).lean();
}

export async function renewImageLease(uploadJobId: string, leaseOwner: string) {
  const result = await UploadJobModel.updateOne({ _id: uploadJobId, imageProcessingStatus: 'processing', leaseOwner }, { $set: { leaseExpiresAt: leaseUntil() } });
  return result.matchedCount === 1;
}

// Marks image processing complete, recording how many photos were attached and which folders
// in the zip didn't match any listing this upload job created.
export async function completeImageProcessing(uploadJobId: string, leaseOwner: string, result: { imagesAttached: number; matchedListings: number; unmatchedFolders: string[] }) {
  const status: ImageProcessingStatus = result.unmatchedFolders.length > 0 ? 'completedWithErrors' : 'completed';
  const update = await UploadJobModel.updateOne(
    { _id: uploadJobId, imageProcessingStatus: 'processing', leaseOwner },
    { $set: { imageProcessingStatus: status, ...result, imageCompletedAt: new Date() }, $unset: { imageFailureReason: 1, leaseExpiresAt: 1, leaseOwner: 1 } },
  );
  return update.matchedCount === 1;
}

export async function failImageProcessing(uploadJobId: string, failureReason: string, leaseOwner?: string) {
  const filter = leaseOwner ? { _id: uploadJobId, imageProcessingStatus: 'processing', leaseOwner } : { _id: uploadJobId, imageProcessingStatus: { $in: ['pending', 'processing'] } };
  const result = await UploadJobModel.updateOne(filter, { $set: { imageProcessingStatus: 'failed', imageFailureReason: failureReason.slice(0, 1_000), imageCompletedAt: new Date() }, $unset: { leaseExpiresAt: 1, leaseOwner: 1 } });
  return result.matchedCount === 1;
}

export async function retryImageProcessing(uploadJobId: string, leaseOwner: string, failureReason: string) {
  const result = await UploadJobModel.updateOne(
    { _id: uploadJobId, imageProcessingStatus: 'processing', leaseOwner },
    { $set: { imageProcessingStatus: 'pending', imageFailureReason: failureReason.slice(0, 1_000) }, $unset: { processingStartedAt: 1, leaseExpiresAt: 1, leaseOwner: 1 } },
  );
  return result.matchedCount === 1;
}

// ---------------------------------------------------------------------------------------------
// Reaper / reconciliation queries.
// ---------------------------------------------------------------------------------------------

// Jobs whose lease outlived the worker that claimed them (it crashed or was killed mid-job).
export function findExpiredLeaseUploadJobs(now = new Date()) {
  return UploadJobModel.find({ status: 'processing', leaseExpiresAt: { $lt: now } }).select('_id attemptCount').lean();
}

export function findExpiredLeaseImageJobs(now = new Date()) {
  return UploadJobModel.find({ imageProcessingStatus: 'processing', leaseExpiresAt: { $lt: now } }).select('_id imageAttemptCount').lean();
}

// Jobs that have been pending longer than expected: their queue message may never have been
// written (Redis down or a crash right after the MongoDB insert), or it was lost or exhausted.
// The MongoDB record is the durable source of truth, so these are re-enqueued from here.
export function findStalePendingUploadJobs(pendingSince: Date) {
  return UploadJobModel.find({ status: 'pending', updatedAt: { $lt: pendingSince } }).select('_id attemptCount').limit(200).lean();
}

export function findStalePendingImageJobs(pendingSince: Date) {
  return UploadJobModel.find({ imageProcessingStatus: 'pending', updatedAt: { $lt: pendingSince } }).select('_id imageAttemptCount').limit(200).lean();
}
