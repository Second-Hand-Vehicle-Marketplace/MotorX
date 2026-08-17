import type { Response } from 'express';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import { changeDealerListingStatus, createDealerListing, deleteDealerListing, getDealerListings, updateDealerListing } from './listing.service.js';
import type { CreateListingBody, ListListingsQuery, UpdateListingBody } from './listing.validation.js';
import type { ListingStatus } from '@motorx/shared-contracts';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';

// Creates a listing owned by the authenticated dealer.
export async function createListing(request: AuthenticatedRequest, response: Response): Promise<void> {
  const listing = await createDealerListing(request.localUser!._id, request.body as CreateListingBody);
  sendSuccess(response, listing, { status: 201 });
}

// Sends all listings owned by the authenticated dealer.
export async function listMyListings(request: AuthenticatedRequest, response: Response): Promise<void> {
  const result = await getDealerListings(request.localUser!._id, request.query as unknown as ListListingsQuery);
  sendSuccess(response, result.listings, { meta: { pagination: result.pagination } });
}

// Updates editable fields on an owned listing.
export async function updateListing(request: AuthenticatedRequest, response: Response): Promise<void> {
  sendSuccess(response, await updateDealerListing(String(request.params.listingId), request.localUser!._id, request.body as UpdateListingBody));
}

// Moves an owned listing through its allowed lifecycle.
export async function updateListingStatus(request: AuthenticatedRequest, response: Response): Promise<void> {
  sendSuccess(response, await changeDealerListingStatus(String(request.params.listingId), request.localUser!._id, request.body.status as ListingStatus));
}

// Permanently deletes an owned listing.
export async function deleteListing(request: AuthenticatedRequest, response: Response): Promise<void> {
  await deleteDealerListing(String(request.params.listingId), request.localUser!._id);
  sendSuccess(response, null);
}
