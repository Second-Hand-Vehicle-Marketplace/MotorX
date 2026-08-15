import mongoose, { type Types } from 'mongoose';
import type { ValidInventoryRow } from '../pipeline/validate.js';

export type ImportableListing = ValidInventoryRow & { dealerId: Types.ObjectId; sourceUploadJobId: Types.ObjectId; images: []; status: 'draft' };

const listingSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, required: true }, sourceUploadJobId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true }, make: { type: String, required: true }, model: { type: String, required: true },
  year: { type: Number, required: true }, price: { type: Number, required: true }, currency: { type: String, required: true },
  mileageKm: { type: Number, required: true }, fuelType: { type: String, required: true }, transmission: { type: String, required: true },
  location: { type: String, required: true }, description: String, images: { type: Array, default: [] }, status: { type: String, default: 'draft' },
}, { collection: 'listings', timestamps: true, versionKey: false });
const ListingModel = mongoose.models.Listing ?? mongoose.model('Listing', listingSchema);

// Loads exact candidate matches for duplicate comparison within one dealer account.
export async function findExistingListingCandidates(dealerId: Types.ObjectId, rows: ValidInventoryRow[]) {
  if (!rows.length) return [];
  return ListingModel.find({ dealerId, $or: rows.map((row) => ({ title: row.title, make: row.make, model: row.model, year: row.year })) }).select('title make model year').lean();
}

// Inserts validated draft listings as one ordered batch owned by the upload's dealer.
export async function insertImportedListings(rows: ImportableListing[]) { if (!rows.length) return []; return ListingModel.insertMany(rows, { ordered: true }); }
