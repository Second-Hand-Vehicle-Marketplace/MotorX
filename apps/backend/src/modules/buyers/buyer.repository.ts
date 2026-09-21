import { ListingModel } from '../marketplace/listing.model.js';
import { listStructuredListings } from '../search/search.repository.js';
import type { ListBuyerListingsQuery } from './buyer.validation.js';

// Returns a filtered page containing only publicly available listings.
export function listBuyerListings(options: ListBuyerListingsQuery) { return listStructuredListings(options); }

// Returns one listing only when it is publicly active.
export function findBuyerListingById(listingId: string) { return ListingModel.findOne({ _id: listingId, status: 'active' }).lean(); }
