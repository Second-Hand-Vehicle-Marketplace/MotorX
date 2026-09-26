import { Router } from 'express';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { getBuyerListing, getBuyerListings, getRecommendedListings, getSimilarListings } from './buyer.controller.js';
import { buyerListingIdParamsSchema, listBuyerListingsQuerySchema, recommendationsQuerySchema, similarListingsQuerySchema } from './buyer.validation.js';

export const buyerRouter = Router();
buyerRouter.get('/', validateRequest({ query: listBuyerListingsQuerySchema }), asyncHandler(getBuyerListings));
// Registered before /:listingId, which would otherwise try to read "recommendations" as a listing ID.
buyerRouter.get('/recommendations', validateRequest({ query: recommendationsQuerySchema }), asyncHandler(getRecommendedListings));
buyerRouter.get('/:listingId/similar', validateRequest({ params: buyerListingIdParamsSchema, query: similarListingsQuerySchema }), asyncHandler(getSimilarListings));
buyerRouter.get('/:listingId', validateRequest({ params: buyerListingIdParamsSchema }), asyncHandler(getBuyerListing));
