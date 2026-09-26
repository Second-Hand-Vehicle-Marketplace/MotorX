import type { ListingDto } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { DealerModel } from '../dealers/dealer.model.js';
import { serializeListing } from '../marketplace/listing.service.js';
import type { ListingRecord } from '../marketplace/listing.repository.js';
import { findBuyerListingById, findRecommendationCandidates, findViewedListings, listBuyerListings } from './buyer.repository.js';
import { profileScore, rankByScore, similarityScore, type ComparableVehicle } from './buyer.similarity.js';
import type { ListBuyerListingsQuery } from './buyer.validation.js';

export interface BuyerDealerInfo { businessName: string; location: string; phone: string; email: string; description: string; website: string | null }
export type BuyerListingDetailDto = ListingDto & { dealer: BuyerDealerInfo | null };

// Returns listings and pagination together inside data instead of response metadata.
export async function browseListingsAsBuyer(query: ListBuyerListingsQuery) { const result = await listBuyerListings(query); return { listings: result.documents.map((item) => serializeListing(item as unknown as ListingRecord)), pagination: buildPaginationMeta(query.page, query.limit, result.total) }; }

// Returns the requested active listing, with its dealer's public profile, or a public not-found response.
export async function viewListingAsBuyer(listingId: string): Promise<BuyerListingDetailDto> {
  const listing = await findBuyerListingById(listingId);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  const record = listing as unknown as ListingRecord;
  // Not filtered by application status: the listing itself is already the buyer-facing gate
  // (only active listings reach this endpoint at all), so a dealer whose review is still
  // pending shouldn't have their business identity hidden from a buyer viewing their listing.
  const dealer = await DealerModel.findOne({ userId: record.dealerId })
    .select('businessName city province businessPhone businessEmail description website')
    .lean();
  return {
    ...serializeListing(record),
    dealer: dealer ? { businessName: dealer.businessName, location: `${dealer.city}, ${dealer.province}`, phone: dealer.businessPhone, email: dealer.businessEmail, description: dealer.description, website: dealer.website ?? null } : null,
  };
}

type CandidateRecord = ListingRecord & ComparableVehicle;

// Candidates in a similar price band first. When that band is too thin (a rare model, a small
// marketplace), other vehicles of the same types fill the gap, so the section is rarely empty.
async function candidatePool(options: { categories: string[]; excludeIds: ListingRecord['_id'][]; priceMin: number; priceMax: number }, wanted: number) {
  const nearby = await findRecommendationCandidates(options) as unknown as CandidateRecord[];
  if (nearby.length >= wanted) return nearby;
  const seen = new Set(nearby.map((listing) => String(listing._id)));
  const wider = await findRecommendationCandidates({ categories: options.categories, excludeIds: options.excludeIds }) as unknown as CandidateRecord[];
  return [...nearby, ...wider.filter((listing) => !seen.has(String(listing._id)))];
}

// "Similar vehicles" on a listing page: the same kind of vehicle, closest in make, model, price and age.
export async function similarListingsForBuyer(listingId: string, limit: number) {
  const seed = await findBuyerListingById(listingId) as unknown as CandidateRecord | null;
  if (!seed) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  const pool = await candidatePool({ categories: [seed.category], excludeIds: [seed._id], priceMin: seed.price * 0.5, priceMax: seed.price * 1.6 }, limit);
  return { listings: rankByScore(pool, (candidate) => similarityScore(seed, candidate), limit).map((listing) => serializeListing(listing)) };
}

// "Recommended for you": ranks public listings against the vehicles this browser viewed recently
// (sent by the page, newest first). Nothing about the buyer is stored on the server.
export async function recommendedListingsForBuyer(viewedIds: string[], limit: number) {
  const viewed = await findViewedListings(viewedIds) as unknown as CandidateRecord[];
  // Keep the page's order (newest view first), which sets how much each view counts.
  const seeds = viewedIds.map((id) => viewed.find((listing) => String(listing._id) === id)).filter((listing): listing is CandidateRecord => Boolean(listing));
  if (!seeds.length) return { listings: [], basedOn: 0 };
  const prices = seeds.map((seed) => seed.price);
  const pool = await candidatePool({
    categories: [...new Set(seeds.map((seed) => seed.category))],
    excludeIds: seeds.map((seed) => seed._id),
    priceMin: Math.min(...prices) * 0.5,
    priceMax: Math.max(...prices) * 1.6,
  }, limit);
  return { listings: rankByScore(pool, (candidate) => profileScore(seeds, candidate), limit).map((listing) => serializeListing(listing)), basedOn: seeds.length };
}
