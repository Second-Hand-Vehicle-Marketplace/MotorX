import type { Types } from 'mongoose';
import { ListingModel, type Listing, type ListingStatus } from './listing.model.js';

export type ListingRecord = Listing & { _id: Types.ObjectId };

// Inserts a dealer-owned listing document.
export async function createListingRecord(input: Omit<Listing, 'createdAt' | 'updatedAt'>) {
  return ListingModel.create(input);
}

// Finds a currently listed (draft/active) vehicle sharing the given normalized registration
// number, excluding one listing (used when editing/reactivating that same listing).
export async function findActiveListingByRegistration(normalizedRegistrationNumber: string, excludeListingId?: string) {
  return ListingModel.findOne({
    normalizedRegistrationNumber,
    status: { $in: ['draft', 'active'] },
    ...(excludeListingId ? { _id: { $ne: excludeListingId } } : {}),
  }).select('_id').lean();
}

// Active listings the dealer has not confirmed since `cutoff`. Listings saved before
// lastConfirmedAt existed fall back to their last update time.
export function staleListingFilter(dealerId: Types.ObjectId, cutoff: Date) {
  return { dealerId, status: 'active', $or: [{ lastConfirmedAt: { $lt: cutoff } }, { lastConfirmedAt: { $exists: false }, updatedAt: { $lt: cutoff } }] };
}

// Returns all statuses of listings owned by one dealer.
export async function listDealerListings(dealerId: Types.ObjectId, page: number, limit: number, options: { search?: string; status?: ListingStatus; category?: string; staleBefore?: Date; uploadJobId?: string } = {}) {
  const filter: Record<string, unknown> = options.staleBefore ? staleListingFilter(dealerId, options.staleBefore) : { dealerId };
  if (options.status && !options.staleBefore) filter.status = options.status;
  if (options.uploadJobId) filter.sourceUploadJobId = options.uploadJobId;
  if (options.category) filter.category = options.category;
  if (options.search) { const search = new RegExp(options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); filter.$or = [{ title: search }, { make: search }, { model: search }, { registrationNumber: search }]; }
  // Stale stock is listed oldest-confirmed first, so the most neglected listings come first.
  const sort: Record<string, 1 | -1> = options.staleBefore ? { lastConfirmedAt: 1, updatedAt: 1, _id: 1 } : { createdAt: -1, _id: -1 };
  const [documents, total] = await Promise.all([
    ListingModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    ListingModel.countDocuments(filter),
  ]);
  return { documents: documents as unknown as ListingRecord[], total };
}

// Listings that count toward the per-dealer limit: drafts and active listings (sold and archived do not).
export function countOpenDealerListings(dealerId: Types.ObjectId) {
  return ListingModel.countDocuments({ dealerId, status: { $in: ['draft', 'active'] } });
}

export async function countDealerListings(dealerId: Types.ObjectId, staleBefore: Date) {
  const [total, active, draft, sold, archived, stale] = await Promise.all([
    ListingModel.countDocuments({ dealerId }), ListingModel.countDocuments({ dealerId, status: 'active' }),
    ListingModel.countDocuments({ dealerId, status: 'draft' }), ListingModel.countDocuments({ dealerId, status: 'sold' }),
    ListingModel.countDocuments({ dealerId, status: 'archived' }), ListingModel.countDocuments(staleListingFilter(dealerId, staleBefore)),
  ]);
  return { total, active, draft, sold, archived, stale };
}

// Updates a listing only when it belongs to the authenticated dealer.
export async function updateOwnedListing(listingId: string, dealerId: Types.ObjectId, update: Record<string, unknown>, unsetDescription = false, unsetEmbedding = false) {
  const unset = { ...(unsetDescription ? { description: 1 } : {}), ...(unsetEmbedding ? { embedding: 1 } : {}) };
  return ListingModel.findOneAndUpdate(
    { _id: listingId, dealerId },
    { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { new: true, runValidators: true },
  );
}

// Loads a listing scoped to its owner for business-rule checks.
export async function findOwnedListing(listingId: string, dealerId: Types.ObjectId) {
  return ListingModel.findOne({ _id: listingId, dealerId });
}

// Permanently removes a listing only when it belongs to the authenticated dealer.
export async function deleteOwnedListing(listingId: string, dealerId: Types.ObjectId) {
  return ListingModel.findOneAndDelete({ _id: listingId, dealerId });
}

// Applies a status change only if the expected current status still matches.
export async function transitionOwnedListingStatus(listingId: string, dealerId: Types.ObjectId, currentStatus: ListingStatus, update: Record<string, unknown>) {
  return ListingModel.findOneAndUpdate({ _id: listingId, dealerId, status: currentStatus }, { $set: update }, { new: true, runValidators: true });
}

// Adds image metadata only when the listing is owned and below its image limit.
export async function addOwnedListingImage(listingId: string, dealerId: Types.ObjectId, image: Listing['images'][number], maximum: number) {
  return ListingModel.findOneAndUpdate(
    { _id: listingId, dealerId, $expr: { $lt: [{ $size: '$images' }, maximum] } },
    { $push: { images: image } },
    { new: true, runValidators: true },
  );
}

// Removes image metadata from a dealer-owned listing.
export async function removeOwnedListingImage(listingId: string, dealerId: Types.ObjectId, imageKey: string) {
  return ListingModel.findOneAndUpdate(
    { _id: listingId, dealerId, 'images.key': imageKey },
    { $pull: { images: { key: imageKey } } },
    { new: true, runValidators: true },
  );
}

// Restores image metadata when deleting the storage object fails.
export async function restoreOwnedListingImage(listingId: string, dealerId: Types.ObjectId, image: Listing['images'][number]) {
  return ListingModel.findOneAndUpdate({ _id: listingId, dealerId }, { $push: { images: image } }, { new: true, runValidators: true });
}

// Replaces image metadata with a validated dealer-defined order.
export async function reorderOwnedListingImages(listingId: string, dealerId: Types.ObjectId, images: Listing['images']) {
  return ListingModel.findOneAndUpdate({ _id: listingId, dealerId }, { $set: { images } }, { new: true, runValidators: true });
}

// The dealer's own listings a bulk action targets: chosen IDs, or everything from one CSV upload.
export type BulkListingScope = { dealerId: Types.ObjectId; _id?: { $in: string[] }; sourceUploadJobId?: string };

export function countListingsInScope(scope: BulkListingScope) {
  return ListingModel.countDocuments(scope);
}

// Applies one update to every listing in scope whose status allows it. `update` may be an
// aggregation pipeline, so values can depend on each listing (its price, its first publish date).
export async function updateListingsInScope(scope: BulkListingScope, eligible: Record<string, unknown>, update: Record<string, unknown> | Array<Record<string, unknown>>) {
  // Mongoose cannot run schema validators on pipeline updates; those only compute values from
  // already-valid fields (a lower price, an existing date).
  const result = await ListingModel.updateMany({ ...scope, ...eligible }, update, { runValidators: !Array.isArray(update) });
  return result.modifiedCount;
}

// Deletes the archived listings in scope and returns the image keys they held, for storage cleanup.
export async function deleteArchivedListingsInScope(scope: BulkListingScope) {
  const filter = { ...scope, status: 'archived' };
  const listings = await ListingModel.find(filter).select('_id images.key').lean<Array<{ _id: Types.ObjectId; images: Array<{ key: string }> }>>();
  if (!listings.length) return { deleted: 0, imageKeys: [] as string[] };
  // Only the listings read above are deleted, so every deleted listing's photos are cleaned up.
  const result = await ListingModel.deleteMany({ ...filter, _id: { $in: listings.map((listing) => listing._id) } });
  return { deleted: result.deletedCount, imageKeys: listings.flatMap((listing) => listing.images.map((image) => image.key)) };
}
