import type { Types } from 'mongoose';
import { ListingModel, type Listing } from './listing.model.js';

export type ListingRecord = Listing & { _id: Types.ObjectId };

export interface ListActiveListingsOptions {
  page: number;
  limit: number;
}

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

export async function createListingRecord(input: Omit<Listing, 'createdAt' | 'updatedAt'>) {
  return ListingModel.create(input);
}

export async function findActiveListingById(listingId: string) {
  return ListingModel.findOne({ _id: listingId, status: 'active' }).lean() as unknown as Promise<ListingRecord | null>;
}
