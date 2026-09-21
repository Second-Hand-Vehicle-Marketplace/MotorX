import type { FilterQuery, SortOrder } from 'mongoose';
import { ListingModel, type Listing } from '../marketplace/listing.model.js';
import { env } from '../../config/env.js';

export interface SearchFilters {
  page: number;
  limit: number;
  search?: string;
  make?: string;
  model?: string;
  location?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  category?: string;
  bodyType?: string;
  condition?: string;
  fuelType?: string;
  transmission?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'year-desc' | 'mileage-asc';
}

// Buyer input is always escaped before it enters a regular expression.
export function escapeSearchRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Produces the single structured-filter definition shared by browse and intelligent search.
export function buildListingFilter(options: SearchFilters): FilterQuery<Listing> {
  const filter: FilterQuery<Listing> = { status: 'active' };
  if (options.make) filter.make = new RegExp(`^${escapeSearchRegex(options.make)}$`, 'i');
  if (options.model) filter.model = new RegExp(escapeSearchRegex(options.model), 'i');
  if (options.location) filter.location = new RegExp(escapeSearchRegex(options.location), 'i');
  if (options.category) filter.category = options.category;
  if (options.fuelType) filter['attributes.fuelType'] = options.fuelType;
  if (options.transmission) filter['attributes.transmission'] = options.transmission;
  if (options.bodyType) filter['attributes.bodyType'] = options.bodyType;
  if (options.condition) filter['attributes.condition'] = options.condition;
  if (options.yearMin !== undefined || options.yearMax !== undefined) filter.year = { ...(options.yearMin !== undefined ? { $gte: options.yearMin } : {}), ...(options.yearMax !== undefined ? { $lte: options.yearMax } : {}) };
  if (options.priceMin !== undefined || options.priceMax !== undefined) filter.price = { ...(options.priceMin !== undefined ? { $gte: options.priceMin } : {}), ...(options.priceMax !== undefined ? { $lte: options.priceMax } : {}) };
  if (options.mileageMin !== undefined || options.mileageMax !== undefined) filter['attributes.mileageKm'] = { ...(options.mileageMin !== undefined ? { $gte: options.mileageMin } : {}), ...(options.mileageMax !== undefined ? { $lte: options.mileageMax } : {}) };
  if (options.search) {
    const search = new RegExp(escapeSearchRegex(options.search), 'i');
    filter.$or = [{ title: search }, { make: search }, { model: search }, { description: search }, { location: search }];
  }
  return filter;
}

export function buildListingSort(sortBy: SearchFilters['sortBy']): Record<string, SortOrder> {
  if (sortBy === 'price-asc') return { price: 1, _id: 1 };
  if (sortBy === 'price-desc') return { price: -1, _id: -1 };
  if (sortBy === 'year-desc') return { year: -1, _id: -1 };
  if (sortBy === 'mileage-asc') return { 'attributes.mileageKm': 1, _id: 1 };
  return { publishedAt: -1, _id: -1 };
}

// Keeps result-set work bounded through validated pagination and indexed filters.
export async function listStructuredListings(options: SearchFilters) {
  const filter = buildListingFilter(options);
  const [documents, total] = await Promise.all([
    ListingModel.find(filter).sort(buildListingSort(options.sortBy)).skip((options.page - 1) * options.limit).limit(options.limit).maxTimeMS(1_800).lean(),
    ListingModel.countDocuments(filter).maxTimeMS(1_800),
  ]);
  return { documents, total };
}

// Retrieves a bounded lexical pool for application-side hybrid scoring.
export async function listSearchCandidates(options: SearchFilters, candidateLimit = 300) {
  const filter = buildListingFilter({ ...options, search: undefined });
  const [documents, total] = await Promise.all([
    ListingModel.find(filter).sort({ publishedAt: -1, _id: -1 }).limit(candidateLimit).maxTimeMS(1_800).lean(),
    ListingModel.countDocuments(filter).maxTimeMS(1_800),
  ]);
  return { documents, total };
}

function buildVectorFilter(options: SearchFilters) {
  const filter: Record<string, unknown> = { status: 'active' };
  if (options.category) filter.category = options.category;
  if (options.fuelType) filter['attributes.fuelType'] = options.fuelType;
  if (options.transmission) filter['attributes.transmission'] = options.transmission;
  if (options.bodyType) filter['attributes.bodyType'] = options.bodyType;
  if (options.condition) filter['attributes.condition'] = options.condition;
  if (options.yearMin !== undefined || options.yearMax !== undefined) filter.year = { ...(options.yearMin !== undefined ? { $gte: options.yearMin } : {}), ...(options.yearMax !== undefined ? { $lte: options.yearMax } : {}) };
  if (options.priceMin !== undefined || options.priceMax !== undefined) filter.price = { ...(options.priceMin !== undefined ? { $gte: options.priceMin } : {}), ...(options.priceMax !== undefined ? { $lte: options.priceMax } : {}) };
  if (options.mileageMin !== undefined || options.mileageMax !== undefined) filter['attributes.mileageKm'] = { ...(options.mileageMin !== undefined ? { $gte: options.mileageMin } : {}), ...(options.mileageMax !== undefined ? { $lte: options.mileageMax } : {}) };
  return filter;
}

// Atlas Vector Search is optional at runtime; callers merge these candidates with lexical ones.
export async function listVectorCandidates(embedding: number[], options: SearchFilters, candidateLimit = 200) {
  return ListingModel.aggregate([
    { $vectorSearch: { index: env.ATLAS_VECTOR_INDEX, path: 'embedding', queryVector: embedding, numCandidates: Math.min(candidateLimit * 5, 1_000), limit: candidateLimit, filter: buildVectorFilter(options) } },
    { $addFields: { vectorScore: { $meta: 'vectorSearchScore' } } },
    { $project: { embedding: 0 } },
  ]).option({ maxTimeMS: 4_500 });
}
