import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const uploadJobSchema = new Schema(
  {
    dealerId: { type: String, required: true, trim: true },
    dealerName: { type: String, required: true, trim: true },
    csvFileName: { type: String, required: true, trim: true },
    zipFileName: { type: String, required: false, trim: true },
    csvFileUrl: { type: String, required: false, trim: true },
    zipFileUrl: { type: String, required: false, trim: true },
    fileSize: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'completedWithErrors', 'failed'], default: 'pending' },
    totalRecords: { type: Number, default: 0 },
    processedRecords: { type: Number, default: 0 },
    validRecords: { type: Number, default: 0 },
    rejectedRecords: { type: Number, default: 0 },
    rejectedRows: { type: [Schema.Types.Mixed], default: [] },
    errorMessage: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date, required: false },
  },
  { versionKey: false },
);

export type UploadJobDocument = InferSchemaType<typeof uploadJobSchema> & { _id: mongoose.Types.ObjectId };

export const UploadJobModel =
  (mongoose.models.UploadJob as mongoose.Model<UploadJobDocument> | undefined) ??
  mongoose.model<UploadJobDocument>('UploadJob', uploadJobSchema);
