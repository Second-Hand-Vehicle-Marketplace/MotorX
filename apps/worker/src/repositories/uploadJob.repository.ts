import mongoose, { type Types } from 'mongoose';

export interface WorkerUploadJob { dealerId: Types.ObjectId; storageKey: string; fileName: string; status: 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed'; totalRecords: number; processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number; failureReason?: string; completedAt?: Date }

const schema = new mongoose.Schema<WorkerUploadJob>({ dealerId: { type: mongoose.Schema.Types.ObjectId, required: true }, storageKey: { type: String, required: true }, fileName: { type: String, required: true }, status: { type: String, required: true }, totalRecords: { type: Number, default: 0 }, processedRecords: { type: Number, default: 0 }, validRecords: { type: Number, default: 0 }, rejectedRecords: { type: Number, default: 0 }, duplicateRecords: { type: Number, default: 0 }, failureReason: String, completedAt: Date }, { collection: 'uploadJobs', timestamps: true, versionKey: false });
const UploadJobModel = mongoose.models.UploadJob ?? mongoose.model<WorkerUploadJob>('UploadJob', schema);

// Claims a pending upload atomically so duplicate queue delivery cannot process it twice.
export function claimPendingUploadJob(uploadJobId: string) { return UploadJobModel.findOneAndUpdate({ _id: uploadJobId, status: 'pending' }, { $set: { status: 'processing' }, $unset: { failureReason: 1 } }, { new: true }).lean(); }

// Saves cumulative ETL counters after a batch has been durably persisted.
export function updateUploadProgress(uploadJobId: string, counts: { processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number }) { return UploadJobModel.updateOne({ _id: uploadJobId, status: 'processing' }, { $set: { totalRecords: counts.processedRecords, ...counts } }); }

// Marks a fully processed upload using error-aware terminal status semantics.
export function completeUploadJob(uploadJobId: string, counts: { processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number }) { const status = counts.rejectedRecords > 0 || counts.duplicateRecords > 0 ? 'completedWithErrors' : 'completed'; return UploadJobModel.updateOne({ _id: uploadJobId, status: 'processing' }, { $set: { status, totalRecords: counts.processedRecords, ...counts, completedAt: new Date() }, $unset: { failureReason: 1 } }); }

// Records an actionable terminal failure after parsing or infrastructure errors.
export function failUploadJob(uploadJobId: string, failureReason: string) { return UploadJobModel.updateOne({ _id: uploadJobId }, { $set: { status: 'failed', failureReason: failureReason.slice(0, 1_000), completedAt: new Date() } }); }
