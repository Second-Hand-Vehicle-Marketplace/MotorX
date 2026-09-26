import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import { browseListingsAsBuyer, recommendedListingsForBuyer, similarListingsForBuyer, viewListingAsBuyer } from './buyer.service.js';
import type { ListBuyerListingsQuery, RecommendationsQuery, SimilarListingsQuery } from './buyer.validation.js';

// Sends the public marketplace collection without using response metadata.
export async function getBuyerListings(request: Request, response: Response) { sendSuccess(response, await browseListingsAsBuyer(request.query as unknown as ListBuyerListingsQuery)); }

// Sends one public vehicle listing.
export async function getBuyerListing(request: Request, response: Response) { sendSuccess(response, await viewListingAsBuyer(String(request.params.listingId))); }

// Sends the public listings most like one listing.
export async function getSimilarListings(request: Request, response: Response) {
  sendSuccess(response, await similarListingsForBuyer(String(request.params.listingId), (request.query as unknown as SimilarListingsQuery).limit));
}

// Sends public listings matched to the vehicles this browser viewed recently.
export async function getRecommendedListings(request: Request, response: Response) {
  const query = request.query as unknown as RecommendationsQuery;
  sendSuccess(response, await recommendedListingsForBuyer(query.viewed, query.limit));
}
