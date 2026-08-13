import type { Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { createListingRecord, findActiveListingById, listActiveListings, type ListingRecord } from './listing.repository.js';
import type { CreateListingBody, ListListingsQuery } from './listing.validation.js';

function serializeListing(listing: ListingRecord) {
  return {
    id: listing._id.toString(), dealerId: listing.dealerId.toString(), title: listing.title,
    make: listing.make, model: listing.model, year: listing.year, price: listing.price,
    currency: listing.currency, mileageKm: listing.mileageKm, fuelType: listing.fuelType,
    transmission: listing.transmission, location: listing.location,
    description: listing.description ?? null,
    images: listing.images.slice().sort((a, b) => a.order - b.order).map((image) => ({ ...image, alt: image.alt ?? null })),
    status: listing.status, publishedAt: listing.publishedAt?.toISOString() ?? null,
  };
}

export async function getActiveListings(query: ListListingsQuery) {
  const { documents, total } = await listActiveListings(query);
  return {
    listings: documents.map(serializeListing),
    pagination: { page: query.page, limit: query.limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / query.limit) },
  };
}

export async function createDealerListing(dealerId: Types.ObjectId, input: CreateListingBody) {
  const document = await createListingRecord({
    ...input, dealerId, images: [], publishedAt: input.status === 'active' ? new Date() : undefined,
  });
  return serializeListing(document.toObject() as ListingRecord);
}

export async function getActiveListing(listingId: string) {
  const listing = await findActiveListingById(listingId);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  return serializeListing(listing);
}
