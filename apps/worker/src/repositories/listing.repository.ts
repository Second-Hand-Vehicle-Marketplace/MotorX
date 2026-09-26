import mongoose, { type Types } from 'mongoose';
import { normalizeRegistrationNumber, vehicleCategories } from '@motorx/shared-contracts';
import type { ValidInventoryRow } from '../pipeline/validate.js';

export type ImportableListing = ValidInventoryRow & { dealerId: Types.ObjectId; sourceUploadJobId: Types.ObjectId; sourceRowNumber: number; images: []; status: 'draft'; embedding?: number[] };
export interface WorkerListingImage { key: string; url: string; thumbUrl?: string; alt?: string; order: number }

const listingSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, required: true }, sourceUploadJobId: { type: mongoose.Schema.Types.ObjectId, required: true }, sourceRowNumber: Number,
  registrationNumber: { type: String, required: true }, normalizedRegistrationNumber: { type: String, required: true },
  title: { type: String, required: true }, make: { type: String, required: true }, model: { type: String, required: true },
  year: { type: Number, required: true }, category: { type: String, enum: vehicleCategories, required: true },
  price: { type: Number, required: true }, currency: { type: String, required: true },
  location: { type: String, required: true }, description: String, attributes: { type: mongoose.Schema.Types.Mixed, required: true },
  images: { type: Array, default: [] }, status: { type: String, default: 'draft' },
  embedding: { type: [Number], select: false, default: undefined },
}, { collection: 'listings', timestamps: true, versionKey: false });
// One listing per CSV row per upload: a retried batch can never import the same row twice.
listingSchema.index({ sourceUploadJobId: 1, sourceRowNumber: 1 }, { unique: true, partialFilterExpression: { sourceRowNumber: { $exists: true } }, name: 'sourceUploadJobId_sourceRowNumber' });
const ListingModel = mongoose.models.Listing ?? mongoose.model('Listing', listingSchema);

// Returns which of the given normalized registration numbers already belong to a currently
// listed (draft/active) vehicle — archived/sold listings don't block a CSV row from importing.
export async function findActivelyListedRegistrations(normalizedRegistrationNumbers: string[]): Promise<Set<string>> {
  if (!normalizedRegistrationNumbers.length) return new Set();
  const matches = await ListingModel.find({ normalizedRegistrationNumber: { $in: normalizedRegistrationNumbers }, status: { $in: ['draft', 'active'] } }).select('normalizedRegistrationNumber').lean();
  return new Set(matches.map((row: any) => row.normalizedRegistrationNumber as string));
}

// Drafts and active listings count toward the per-dealer listing limit.
export function countOpenDealerListings(dealerId: Types.ObjectId) {
  return ListingModel.countDocuments({ dealerId, status: { $in: ['draft', 'active'] } });
}

// Returns which of these CSV row numbers an earlier attempt of this upload already imported.
export async function findImportedRowNumbers(uploadJobId: Types.ObjectId, rowNumbers: number[]): Promise<Set<number>> {
  if (!rowNumbers.length) return new Set();
  const rows = await ListingModel.find({ sourceUploadJobId: uploadJobId, sourceRowNumber: { $in: rowNumbers } }).select('sourceRowNumber').lean();
  return new Set(rows.map((row: any) => row.sourceRowNumber as number));
}

// Inserts validated draft listings as one ordered batch owned by the upload's dealer.
export async function insertImportedListings(rows: ImportableListing[]) {
  if (!rows.length) return [];
  return ListingModel.insertMany(rows.map((row) => ({ ...row, normalizedRegistrationNumber: normalizeRegistrationNumber(row.registrationNumber) })), { ordered: true });
}

// Loads every listing this exact upload job created, for matching against zip folder names.
export async function findListingsByUploadJob(uploadJobId: Types.ObjectId) {
  return ListingModel.find({ sourceUploadJobId: uploadJobId }).select('normalizedRegistrationNumber images').lean();
}

// Appends photos to one listing, capped at the configured per-listing image limit. Refuses the
// whole append if any of these keys is already attached, so overlapping attempts cannot duplicate.
export async function appendListingImages(listingId: Types.ObjectId, images: WorkerListingImage[], maximum: number) {
  if (!images.length) return;
  return ListingModel.updateOne(
    { _id: listingId, 'images.key': { $nin: images.map((image) => image.key) }, $expr: { $lte: [{ $add: [{ $size: '$images' }, images.length] }, maximum] } },
    { $push: { images: { $each: images } } },
  );
}

// Dealers with active listings not confirmed since `cutoff`, with how many. Listings saved before
// lastConfirmedAt existed fall back to their last update time (same rule as the dealer's stale list).
export function countStaleListingsByDealer(cutoff: Date, limit: number): Promise<Array<{ _id: Types.ObjectId; count: number }>> {
  return ListingModel.aggregate([
    { $match: { status: 'active', $or: [{ lastConfirmedAt: { $lt: cutoff } }, { lastConfirmedAt: { $exists: false }, updatedAt: { $lt: cutoff } }] } },
    { $group: { _id: '$dealerId', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: limit },
  ]);
}
