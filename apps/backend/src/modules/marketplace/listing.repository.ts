import type { Types } from 'mongoose';
import { ListingModel, type Listing, type ListingStatus } from './listing.model.js';

export type ListingRecord = Listing & { _id: Types.ObjectId };

export interface ListActiveListingsOptions {
  page: number;
  limit: number;
}

// Returns a newest-first page of publicly visible listings.
export async function listActiveListings({ page, limit }: ListActiveListingsOptions) {
  const filter = { status: 'active' as const };
  const [documents, total] = await Promise.all([
    ListingModel.find(filter)
      .sort({ publishedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ListingModel.countDocuments(filter),
  ]);

  return { documents: documents as unknown as ListingRecord[], total };
}

// Inserts a dealer-owned listing document.
export async function createListingRecord(input: Omit<Listing, 'createdAt' | 'updatedAt'>) {
  return ListingModel.create(input);
}

// Finds one publicly visible listing by ID.
export async function findActiveListingById(listingId: string) {
  return ListingModel.findOne({ _id: listingId, status: 'active' }).lean() as unknown as Promise<ListingRecord | null>;
}

// Returns all statuses of listings owned by one dealer.
export async function listDealerListings(dealerId: Types.ObjectId, page: number, limit: number) {
  const filter = { dealerId };
  const [documents, total] = await Promise.all([
    ListingModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ListingModel.countDocuments(filter),
  ]);
  return { documents: documents as unknown as ListingRecord[], total };
}

// Updates a listing only when it belongs to the authenticated dealer.
export async function updateOwnedListing(listingId: string, dealerId: Types.ObjectId, update: Record<string, unknown>, unsetDescription = false) {
  return ListingModel.findOneAndUpdate(
    { _id: listingId, dealerId },
    { $set: update, ...(unsetDescription ? { $unset: { description: 1 } } : {}) },
    { new: true, runValidators: true },
  );
}

// Loads a listing scoped to its owner for business-rule checks.
export async function findOwnedListing(listingId: string, dealerId: Types.ObjectId) {
  return ListingModel.findOne({ _id: listingId, dealerId });
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
