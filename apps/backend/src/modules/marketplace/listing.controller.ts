import type { Request, Response } from 'express';
import { createDealerListing, getActiveListing, getActiveListings } from './listing.service.js';
import type { CreateListingBody, ListListingsQuery } from './listing.validation.js';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';

export async function listListings(request: Request, response: Response): Promise<void> {
  const result = await getActiveListings(request.query as unknown as ListListingsQuery);
  response.status(200).json({
    success: true,
    data: result.listings,
    meta: { pagination: result.pagination },
  });
}

export async function createListing(request: AuthenticatedRequest, response: Response): Promise<void> {
  const listing = await createDealerListing(request.localUser!._id, request.body as CreateListingBody);
  response.status(201).json({ success: true, data: listing, meta: null });
}

export async function getListing(request: Request, response: Response): Promise<void> {
  const listing = await getActiveListing(String(request.params.listingId));
  response.status(200).json({ success: true, data: listing, meta: null });
}
