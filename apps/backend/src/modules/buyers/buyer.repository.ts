import type { FilterQuery, SortOrder } from 'mongoose';
import { ListingModel, type Listing } from '../marketplace/listing.model.js';
import type { ListBuyerListingsQuery } from './buyer.validation.js';

// Escapes buyer text before constructing case-insensitive MongoDB filters.
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Returns a filtered page containing only publicly available listings.
export async function listBuyerListings(options: ListBuyerListingsQuery) {
  const filter: FilterQuery<Listing> = { status: 'active' };
  if (options.make) filter.make = new RegExp(`^${escapeRegex(options.make)}$`, 'i');
  if (options.model) filter.model = new RegExp(escapeRegex(options.model), 'i');
  if (options.fuelType) filter.fuelType = options.fuelType;
  if (options.transmission) filter.transmission = options.transmission;
  if (options.yearMin !== undefined || options.yearMax !== undefined) filter.year = { ...(options.yearMin !== undefined ? { $gte: options.yearMin } : {}), ...(options.yearMax !== undefined ? { $lte: options.yearMax } : {}) };
  if (options.priceMin !== undefined || options.priceMax !== undefined) filter.price = { ...(options.priceMin !== undefined ? { $gte: options.priceMin } : {}), ...(options.priceMax !== undefined ? { $lte: options.priceMax } : {}) };
  if (options.search) { const search = new RegExp(escapeRegex(options.search), 'i'); filter.$or = [{ title: search }, { make: search }, { model: search }, { description: search }]; }
  const sort: Record<string, SortOrder> = options.sortBy === 'price-asc' ? { price: 1 } : options.sortBy === 'price-desc' ? { price: -1 } : options.sortBy === 'year-desc' ? { year: -1 } : options.sortBy === 'mileage-asc' ? { mileageKm: 1 } : { publishedAt: -1, _id: -1 };
  const [documents, total] = await Promise.all([ListingModel.find(filter).sort(sort).skip((options.page - 1) * options.limit).limit(options.limit).lean(), ListingModel.countDocuments(filter)]);
  return { documents, total };
}

// Returns one listing only when it is publicly active.
export function findBuyerListingById(listingId: string) { return ListingModel.findOne({ _id: listingId, status: 'active' }).lean(); }
