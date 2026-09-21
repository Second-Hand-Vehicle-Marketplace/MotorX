import type { ListingDto } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { DealerModel } from '../dealers/dealer.model.js';
import { serializeListing } from '../marketplace/listing.service.js';
import type { ListingRecord } from '../marketplace/listing.repository.js';
import { findBuyerListingById, listBuyerListings } from './buyer.repository.js';
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
