import mongoose, { type Types } from 'mongoose';

export interface UploadJob {
  dealerId: Types.ObjectId; fileName: string; fileSize: number; storageKey: string;
  status: 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';
  totalRecords: number; processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number;
  failureReason?: string; completedAt?: Date; createdAt: Date;
}

const { Schema, model, models } = mongoose;
const uploadJobSchema = new Schema<UploadJob>({
  dealerId: { type: Schema.Types.ObjectId, ref: 'AuthUser', required: true, index: true },
  fileName: { type: String, required: true, trim: true }, fileSize: { type: Number, required: true, min: 1 },
  storageKey: { type: String, required: true }, status: { type: String, enum: ['pending', 'processing', 'completed', 'completedWithErrors', 'failed'], default: 'pending', required: true },
  totalRecords: { type: Number, default: 0, min: 0 }, processedRecords: { type: Number, default: 0, min: 0 },
  validRecords: { type: Number, default: 0, min: 0 }, rejectedRecords: { type: Number, default: 0, min: 0 },
  duplicateRecords: { type: Number, default: 0, min: 0 },
  failureReason: { type: String, trim: true, maxlength: 1000 }, completedAt: Date,
}, { timestamps: true, versionKey: false, collection: 'uploadJobs' });

uploadJobSchema.index({ status: 1, createdAt: -1 });
export const UploadJobModel = models.UploadJob ?? model<UploadJob>('UploadJob', uploadJobSchema);
