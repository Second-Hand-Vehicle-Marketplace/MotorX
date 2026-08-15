import type { Types } from 'mongoose';
import type { ListingDto } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { createListingRecord, findOwnedListing, listDealerListings, transitionOwnedListingStatus, updateOwnedListing, type ListingRecord } from './listing.repository.js';
import type { CreateListingBody, ListListingsQuery, UpdateListingBody } from './listing.validation.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import type { ListingStatus } from '@motorx/shared-contracts';

// Converts a listing record into the shared API DTO.
export function serializeListing(listing: ListingRecord): ListingDto {
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

// Creates a draft or immediately published listing for a dealer.
export async function createDealerListing(dealerId: Types.ObjectId, input: CreateListingBody) {
  const document = await createListingRecord({
    ...input, dealerId, images: [], publishedAt: input.status === 'active' ? new Date() : undefined,
  });
  return serializeListing(document.toObject() as ListingRecord);
}

// Returns every listing owned by the authenticated dealer.
export async function getDealerListings(dealerId: Types.ObjectId, query: ListListingsQuery) {
  const { documents, total } = await listDealerListings(dealerId, query.page, query.limit);
  return { listings: documents.map(serializeListing), pagination: buildPaginationMeta(query.page, query.limit, total) };
}

// Updates editable fields while preserving listing ownership and status.
export async function updateDealerListing(listingId: string, dealerId: Types.ObjectId, input: UpdateListingBody) {
  const update = { ...input } as Record<string, unknown>;
  if (input.description === null) {
    delete update.description;
    const listing = await updateOwnedListing(listingId, dealerId, update, true);
    if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
    return serializeListing(listing.toObject() as ListingRecord);
  }
  const listing = await updateOwnedListing(listingId, dealerId, update);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  return serializeListing(listing.toObject() as ListingRecord);
}

const allowedTransitions: Record<ListingStatus, readonly ListingStatus[]> = {
  draft: ['active', 'archived'], active: ['sold', 'archived'], sold: ['active', 'archived'], archived: [],
};

// Enforces the listing lifecycle before applying an atomic status transition.
export async function changeDealerListingStatus(listingId: string, dealerId: Types.ObjectId, nextStatus: ListingStatus) {
  const existing = await findOwnedListing(listingId, dealerId);
  if (!existing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  const currentStatus = existing.status as ListingStatus;
  if (!allowedTransitions[currentStatus].includes(nextStatus))
    throw new AppError(409, errorCodes.conflict, `A ${currentStatus} listing cannot transition to ${nextStatus}.`);
  const update: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === 'active' && !existing.publishedAt) update.publishedAt = new Date();
  const listing = await transitionOwnedListingStatus(listingId, dealerId, currentStatus, update);
  if (!listing) throw new AppError(409, errorCodes.conflict, 'The listing status changed before this request completed.');
  return serializeListing(listing.toObject() as ListingRecord);
}
