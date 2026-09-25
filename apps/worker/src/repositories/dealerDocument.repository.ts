import mongoose, { type Types } from 'mongoose';

export interface RetainedDealerDocuments { _id: Types.ObjectId; verificationDocuments: Array<{ key: string }> }

// Only the fields the retention job touches; the backend owns the full dealer schema.
const dealerSchema = new mongoose.Schema({
  status: String,
  reviewedAt: Date,
  verificationDocuments: { type: [{ _id: false, key: String }], default: [] },
  documentsDeletedAt: Date,
}, { collection: 'dealers', strict: false, versionKey: false });
const DealerModel = mongoose.models.Dealer ?? mongoose.model('Dealer', dealerSchema);

// Reviewed applications whose decision is older than the cutoff and still have stored files.
export function findDealersWithExpiredDocuments(cutoff: Date, limit: number): Promise<RetainedDealerDocuments[]> {
  return DealerModel.find({
    status: { $in: ['approved', 'rejected'] },
    reviewedAt: { $lte: cutoff },
    'verificationDocuments.0': { $exists: true },
  }).select('verificationDocuments.key').sort({ reviewedAt: 1 }).limit(limit).lean() as unknown as Promise<RetainedDealerDocuments[]>;
}

// Clears the document list only after every file was deleted from storage, and records when.
export function markDealerDocumentsDeleted(dealerId: Types.ObjectId, deletedAt: Date) {
  return DealerModel.updateOne({ _id: dealerId }, { $set: { verificationDocuments: [], documentsDeletedAt: deletedAt } });
}
