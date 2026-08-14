import type { FilterQuery, SortOrder, Types } from 'mongoose';
import { ListingModel, type Listing, type ListingStatus } from './listing.model.js';

export type ListingRecord = Listing & { _id: Types.ObjectId };

export interface ListActiveListingsOptions {
  page: number;
  limit: number;
  search?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  fuelType?: string;
  transmission?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'year-desc' | 'mileage-asc';
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Returns a newest-first page of publicly visible listings.
export async function listActiveListings(options: ListActiveListingsOptions) {
  const { page, limit } = options;
  const filter: FilterQuery<Listing> = { status: 'active' };
  if (options.make) filter.make = new RegExp(`^${escapeRegex(options.make)}$`, 'i');
  if (options.model) filter.model = new RegExp(escapeRegex(options.model), 'i');
  if (options.fuelType) filter.fuelType = options.fuelType;
  if (options.transmission) filter.transmission = options.transmission;
  if (options.yearMin !== undefined || options.yearMax !== undefined)
    filter.year = { ...(options.yearMin !== undefined ? { $gte: options.yearMin } : {}), ...(options.yearMax !== undefined ? { $lte: options.yearMax } : {}) };
  if (options.priceMin !== undefined || options.priceMax !== undefined)
    filter.price = { ...(options.priceMin !== undefined ? { $gte: options.priceMin } : {}), ...(options.priceMax !== undefined ? { $lte: options.priceMax } : {}) };
  if (options.search) {
    const search = new RegExp(escapeRegex(options.search), 'i');
    filter.$or = [{ title: search }, { make: search }, { model: search }, { description: search }];
  }
  const sort: Record<string, SortOrder> = options.sortBy === 'price-asc' ? { price: 1 }
    : options.sortBy === 'price-desc' ? { price: -1 }
      : options.sortBy === 'year-desc' ? { year: -1 }
        : options.sortBy === 'mileage-asc' ? { mileageKm: 1 }
          : { publishedAt: -1, _id: -1 };
  const [documents, total] = await Promise.all([
    ListingModel.find(filter)
      .sort(sort)
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
