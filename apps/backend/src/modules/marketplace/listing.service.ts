import type { Types } from 'mongoose';
import type { ListingDto, VehicleCategory } from '@motorx/shared-contracts';
import { normalizeRegistrationNumber } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import {
  createListingRecord,
  deleteOwnedListing,
  findActiveListingByRegistration,
  findOwnedListing,
  listDealerListings,
  transitionOwnedListingStatus,
  updateOwnedListing,
  type ListingRecord,
} from './listing.repository.js';
import { validateAttributesForCategory, type CreateListingBody, type ListListingsQuery, type UpdateListingBody } from './listing.validation.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { deleteListingImageObject } from './listingImage.storage.js';
import type { ListingImage } from './listing.model.js';
import type { ListingStatus } from '@motorx/shared-contracts';

// Converts a listing record into the shared API DTO.
export function serializeListing(listing: ListingRecord): ListingDto {
  return {
    id: listing._id.toString(), dealerId: listing.dealerId.toString(), registrationNumber: listing.registrationNumber,
    title: listing.title, make: listing.make, model: listing.model, year: listing.year, price: listing.price,
    currency: listing.currency, location: listing.location, description: listing.description ?? null,
    images: listing.images.slice().sort((a, b) => a.order - b.order).map((image) => ({ ...image, alt: image.alt ?? null })),
    status: listing.status, publishedAt: listing.publishedAt?.toISOString() ?? null,
    category: listing.category, attributes: listing.attributes,
  } as ListingDto;
}

// Rejects a registration number that already belongs to a currently listed (draft/active) vehicle.
// Archived/sold listings don't block — the same physical vehicle may legitimately be relisted.
async function assertRegistrationNotActivelyListed(normalizedRegistrationNumber: string, excludeListingId?: string) {
  const existing = await findActiveListingByRegistration(normalizedRegistrationNumber, excludeListingId);
  if (existing) throw new AppError(409, errorCodes.conflict, 'A currently listed vehicle already uses this registration number.');
}

// Creates a draft or immediately published listing for a dealer.
export async function createDealerListing(dealerId: Types.ObjectId, input: CreateListingBody) {
  const normalizedRegistrationNumber = normalizeRegistrationNumber(input.registrationNumber);
  await assertRegistrationNotActivelyListed(normalizedRegistrationNumber);
  const document = await createListingRecord({
    ...input, registrationNumber: input.registrationNumber.trim().toUpperCase(), normalizedRegistrationNumber,
    dealerId, images: [], publishedAt: input.status === 'active' ? new Date() : undefined,
  });
  return serializeListing(document.toObject() as ListingRecord);
}

// Returns every listing owned by the authenticated dealer.
export async function getDealerListings(dealerId: Types.ObjectId, query: ListListingsQuery) {
  const { documents, total } = await listDealerListings(dealerId, query.page, query.limit);
  return { listings: documents.map(serializeListing), pagination: buildPaginationMeta(query.page, query.limit, total) };
}

// Updates editable fields while preserving listing ownership, category, and status.
export async function updateDealerListing(listingId: string, dealerId: Types.ObjectId, input: UpdateListingBody) {
  const existing = await findOwnedListing(listingId, dealerId);
  if (!existing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'attributes' || key === 'description' || value === undefined) continue;
    update[key] = value;
  }

  if (input.registrationNumber) {
    const normalizedRegistrationNumber = normalizeRegistrationNumber(input.registrationNumber);
    if (normalizedRegistrationNumber !== existing.normalizedRegistrationNumber) {
      await assertRegistrationNotActivelyListed(normalizedRegistrationNumber, listingId);
    }
    update.registrationNumber = input.registrationNumber.trim().toUpperCase();
    update.normalizedRegistrationNumber = normalizedRegistrationNumber;
  }

  if (input.attributes) {
    const merged = { ...(existing.attributes as Record<string, unknown>), ...input.attributes };
    const result = validateAttributesForCategory(existing.category as VehicleCategory, merged);
    if (!result.success) throw new AppError(400, errorCodes.validation, result.error.issues.map((issue) => `${issue.path.join('.') || 'attributes'}: ${issue.message}`).join(' '));
    update.attributes = result.data;
  }

  const unsetDescription = input.description === null;
  const listing = await updateOwnedListing(listingId, dealerId, update, unsetDescription);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  return serializeListing(listing.toObject() as ListingRecord);
}

// Permanently removes an owned listing and best-effort cleans up its stored images.
export async function deleteDealerListing(listingId: string, dealerId: Types.ObjectId): Promise<void> {
  const listing = await deleteOwnedListing(listingId, dealerId);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  const results = await Promise.allSettled(listing.images.map((image: ListingImage) => deleteListingImageObject(image.key)));
  for (const result of results) if (result.status === 'rejected') console.error('Failed to delete listing image object.', result.reason);
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
  if (nextStatus === 'active') {
    // Covers the case where this listing went active -> sold, freeing its registration number
    // for a different listing to claim, and this one is now being reactivated.
    await assertRegistrationNotActivelyListed((existing as unknown as ListingRecord).normalizedRegistrationNumber, listingId);
  }
  const update: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === 'active' && !existing.publishedAt) update.publishedAt = new Date();
  const listing = await transitionOwnedListingStatus(listingId, dealerId, currentStatus, update);
  if (!listing) throw new AppError(409, errorCodes.conflict, 'The listing status changed before this request completed.');
  return serializeListing(listing.toObject() as ListingRecord);
}
