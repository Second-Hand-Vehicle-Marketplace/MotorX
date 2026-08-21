import mongoose, { type Types } from 'mongoose';
import { normalizeRegistrationNumber, vehicleCategories } from '@motorx/shared-contracts';
import type { ValidInventoryRow } from '../pipeline/validate.js';

export type ImportableListing = ValidInventoryRow & { dealerId: Types.ObjectId; sourceUploadJobId: Types.ObjectId; images: []; status: 'draft' };
export interface WorkerListingImage { key: string; url: string; alt?: string; order: number }

const listingSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, required: true }, sourceUploadJobId: { type: mongoose.Schema.Types.ObjectId, required: true },
  registrationNumber: { type: String, required: true }, normalizedRegistrationNumber: { type: String, required: true },
  title: { type: String, required: true }, make: { type: String, required: true }, model: { type: String, required: true },
  year: { type: Number, required: true }, category: { type: String, enum: vehicleCategories, required: true },
  price: { type: Number, required: true }, currency: { type: String, required: true },
  location: { type: String, required: true }, description: String, attributes: { type: mongoose.Schema.Types.Mixed, required: true },
  images: { type: Array, default: [] }, status: { type: String, default: 'draft' },
}, { collection: 'listings', timestamps: true, versionKey: false });
const ListingModel = mongoose.models.Listing ?? mongoose.model('Listing', listingSchema);

// Returns which of the given normalized registration numbers already belong to a currently
// listed (draft/active) vehicle — archived/sold listings don't block a CSV row from importing.
export async function findActivelyListedRegistrations(normalizedRegistrationNumbers: string[]): Promise<Set<string>> {
  if (!normalizedRegistrationNumbers.length) return new Set();
  const matches = await ListingModel.find({ normalizedRegistrationNumber: { $in: normalizedRegistrationNumbers }, status: { $in: ['draft', 'active'] } }).select('normalizedRegistrationNumber').lean();
  return new Set(matches.map((row: any) => row.normalizedRegistrationNumber as string));
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

// Appends photos to one listing, capped at the configured per-listing image limit.
export async function appendListingImages(listingId: Types.ObjectId, images: WorkerListingImage[]) {
  if (!images.length) return;
  await ListingModel.updateOne({ _id: listingId }, { $push: { images: { $each: images } } });
}
