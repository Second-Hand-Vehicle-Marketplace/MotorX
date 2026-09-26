import type { Types } from 'mongoose';
import { ListingModel } from '../marketplace/listing.model.js';
import { publicDealerFilter } from '../marketplace/publicVisibility.js';
import { listStructuredListings } from '../search/search.repository.js';
import type { ListBuyerListingsQuery } from './buyer.validation.js';

// Returns a filtered page containing only publicly available listings.
export function listBuyerListings(options: ListBuyerListingsQuery) { return listStructuredListings(options); }

// Returns one listing only when it is public: active, and its dealer is not suspended.
export async function findBuyerListingById(listingId: string) { return ListingModel.findOne({ _id: listingId, status: 'active', ...await publicDealerFilter() }).lean(); }

// Most-recent public listings that could be recommended: bounded, index-friendly (status +
// category + price), never including the vehicles the buyer is already looking at.
export async function findRecommendationCandidates(options: { categories: string[]; excludeIds: Types.ObjectId[]; priceMin?: number; priceMax?: number; limit?: number }) {
  const filter: Record<string, unknown> = { status: 'active', category: { $in: options.categories }, _id: { $nin: options.excludeIds }, ...await publicDealerFilter() };
  if (options.priceMin !== undefined || options.priceMax !== undefined) filter.price = { ...(options.priceMin !== undefined ? { $gte: options.priceMin } : {}), ...(options.priceMax !== undefined ? { $lte: options.priceMax } : {}) };
  return ListingModel.find(filter).sort({ publishedAt: -1, _id: -1 }).limit(options.limit ?? 200).maxTimeMS(1_800).lean();
}

// The vehicles a buyer recently viewed, used only to describe their taste. Sold listings still
// count (the buyer liked that kind of vehicle); drafts and archived listings never do.
export async function findViewedListings(ids: string[]) {
  return ListingModel.find({ _id: { $in: ids }, status: { $in: ['active', 'sold'] } }).lean();
}
