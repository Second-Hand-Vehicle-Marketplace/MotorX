import { ListingModel } from '../marketplace/listing.model.js';
import { publicDealerFilter } from '../marketplace/publicVisibility.js';
import { listStructuredListings } from '../search/search.repository.js';
import type { ListBuyerListingsQuery } from './buyer.validation.js';

// Returns a filtered page containing only publicly available listings.
export function listBuyerListings(options: ListBuyerListingsQuery) { return listStructuredListings(options); }

// Returns one listing only when it is public: active, and its dealer is not suspended.
export async function findBuyerListingById(listingId: string) { return ListingModel.findOne({ _id: listingId, status: 'active', ...await publicDealerFilter() }).lean(); }
