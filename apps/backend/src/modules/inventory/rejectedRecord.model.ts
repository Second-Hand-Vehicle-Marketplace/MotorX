import mongoose, { type Types } from 'mongoose';

export interface RejectedInventoryRecord {
  uploadJobId: Types.ObjectId;
  rowNumber: number;
  originalData: Record<string, unknown>;
  errors: string[];
  reason: 'validation' | 'duplicate';
  createdAt: Date;
}

const { Schema, model, models } = mongoose;

// Read-side mirror of the worker's rejectedRecords schema; the worker owns writes.
const rejectedRecordSchema = new Schema<RejectedInventoryRecord>({
  uploadJobId: { type: Schema.Types.ObjectId, required: true, index: true },
  rowNumber: { type: Number, required: true, min: 2 },
  originalData: { type: Schema.Types.Mixed, required: true },
  errors: { type: [String], required: true },
  reason: { type: String, enum: ['validation', 'duplicate'], required: true },
}, { collection: 'rejectedRecords', timestamps: true, versionKey: false });

rejectedRecordSchema.index({ uploadJobId: 1, rowNumber: 1 }, { unique: true });
export const RejectedRecordModel = models.RejectedRecord ?? model<RejectedInventoryRecord>('RejectedRecord', rejectedRecordSchema);
