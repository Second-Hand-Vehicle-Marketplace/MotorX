import { Router } from 'express';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { getBuyerListing, getBuyerListings } from './buyer.controller.js';
import { buyerListingIdParamsSchema, listBuyerListingsQuerySchema } from './buyer.validation.js';

export const buyerRouter = Router();
buyerRouter.get('/', validateRequest({ query: listBuyerListingsQuerySchema }), asyncHandler(getBuyerListings));
buyerRouter.get('/:listingId', validateRequest({ params: buyerListingIdParamsSchema }), asyncHandler(getBuyerListing));
