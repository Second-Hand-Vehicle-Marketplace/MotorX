import mongoose, { type Types } from 'mongoose';
import type { ExtractedInventoryRow } from '../pipeline/extract.js';

export interface RejectedInventoryRecord { uploadJobId: Types.ObjectId; rowNumber: number; originalData: ExtractedInventoryRow; errors: string[]; reason: 'validation' | 'duplicate' }

const rejectedRecordSchema = new mongoose.Schema<RejectedInventoryRecord>({
  uploadJobId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, rowNumber: { type: Number, required: true, min: 2 },
  originalData: { type: mongoose.Schema.Types.Mixed, required: true }, errors: { type: [String], required: true },
  reason: { type: String, enum: ['validation', 'duplicate'], required: true },
}, { collection: 'rejectedRecords', timestamps: true, versionKey: false });
rejectedRecordSchema.index({ uploadJobId: 1, rowNumber: 1 }, { unique: true });
const RejectedRecordModel = mongoose.models.RejectedRecord ?? mongoose.model<RejectedInventoryRecord>('RejectedRecord', rejectedRecordSchema);

// Persists invalid and duplicate rows in one batch for dealer correction later.
export async function insertRejectedRecords(records: RejectedInventoryRecord[]) { if (!records.length) return []; return RejectedRecordModel.insertMany(records, { ordered: true }); }
