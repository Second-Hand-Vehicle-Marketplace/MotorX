import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import { browseListingsAsBuyer, viewListingAsBuyer } from './buyer.service.js';
import type { ListBuyerListingsQuery } from './buyer.validation.js';

// Sends the public marketplace collection without using response metadata.
export async function getBuyerListings(request: Request, response: Response) { sendSuccess(response, await browseListingsAsBuyer(request.query as unknown as ListBuyerListingsQuery)); }

// Sends one public vehicle listing.
export async function getBuyerListing(request: Request, response: Response) { sendSuccess(response, await viewListingAsBuyer(String(request.params.listingId))); }
