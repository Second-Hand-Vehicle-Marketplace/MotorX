import mongoose, { type Types } from 'mongoose';
import { vehicleCategories, type VehicleCategory } from '@motorx/shared-contracts';

export type ImageProcessingStatus = 'none' | 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';

export interface UploadJob {
  dealerId: Types.ObjectId; fileName: string; fileSize: number; storageKey: string; category: VehicleCategory;
  status: 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';
  totalRecords: number; processedRecords: number; validRecords: number; rejectedRecords: number; duplicateRecords: number;
  failureReason?: string; completedAt?: Date; createdAt: Date;

  // Vehicle photos are attached in a second step, once the CSV has finished processing: the
  // dealer uploads a zip (one folder per registration number) that gets matched against the
  // listings this same upload job already created.
  imageProcessingStatus: ImageProcessingStatus;
  imageZipFileName?: string; imageZipStorageKey?: string;
  imagesAttached: number; matchedListings: number; unmatchedFolders: string[];
  imageFailureReason?: string; imageCompletedAt?: Date;
}

const { Schema, model, models } = mongoose;
const uploadJobSchema = new Schema<UploadJob>({
  dealerId: { type: Schema.Types.ObjectId, ref: 'AuthUser', required: true, index: true },
  fileName: { type: String, required: true, trim: true }, fileSize: { type: Number, required: true, min: 1 },
  storageKey: { type: String, required: true }, category: { type: String, enum: vehicleCategories, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'completedWithErrors', 'failed'], default: 'pending', required: true },
  totalRecords: { type: Number, default: 0, min: 0 }, processedRecords: { type: Number, default: 0, min: 0 },
  validRecords: { type: Number, default: 0, min: 0 }, rejectedRecords: { type: Number, default: 0, min: 0 },
  duplicateRecords: { type: Number, default: 0, min: 0 },
  failureReason: { type: String, trim: true, maxlength: 1000 }, completedAt: Date,

  imageProcessingStatus: { type: String, enum: ['none', 'pending', 'processing', 'completed', 'completedWithErrors', 'failed'], default: 'none', required: true },
  imageZipFileName: { type: String, trim: true }, imageZipStorageKey: { type: String },
  imagesAttached: { type: Number, default: 0, min: 0 }, matchedListings: { type: Number, default: 0, min: 0 },
  unmatchedFolders: { type: [String], default: [] },
  imageFailureReason: { type: String, trim: true, maxlength: 1000 }, imageCompletedAt: Date,
}, { timestamps: true, versionKey: false, collection: 'uploadJobs' });

uploadJobSchema.index({ status: 1, createdAt: -1 });
export const UploadJobModel = models.UploadJob ?? model<UploadJob>('UploadJob', uploadJobSchema);
