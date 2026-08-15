import type { ListingDto } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import type { ListingRecord } from '../marketplace/listing.repository.js';
import { findBuyerListingById, listBuyerListings } from './buyer.repository.js';
import type { ListBuyerListingsQuery } from './buyer.validation.js';

// Converts a listing record into the buyer-facing API contract.
function serializeBuyerListing(listing: ListingRecord): ListingDto { return { id: listing._id.toString(), dealerId: listing.dealerId.toString(), title: listing.title, make: listing.make, model: listing.model, year: listing.year, price: listing.price, currency: listing.currency, mileageKm: listing.mileageKm, fuelType: listing.fuelType, transmission: listing.transmission, location: listing.location, description: listing.description ?? null, images: listing.images.slice().sort((a, b) => a.order - b.order).map((image) => ({ ...image, alt: image.alt ?? null })), status: listing.status, publishedAt: listing.publishedAt?.toISOString() ?? null };
}

// Returns listings and pagination together inside data instead of response metadata.
export async function browseListingsAsBuyer(query: ListBuyerListingsQuery) { const result = await listBuyerListings(query); return { listings: result.documents.map((item) => serializeBuyerListing(item as unknown as ListingRecord)), pagination: buildPaginationMeta(query.page, query.limit, result.total) }; }

// Returns the requested active listing or a public not-found response.
export async function viewListingAsBuyer(listingId: string) { const listing = await findBuyerListingById(listingId); if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.'); return serializeBuyerListing(listing as unknown as ListingRecord); }
