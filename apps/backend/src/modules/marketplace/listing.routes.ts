import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { createListing, getListing, listListings } from './listing.controller.js';
import { createListingBodySchema, listingIdParamsSchema, listListingsQuerySchema } from './listing.validation.js';

export const listingRouter = Router();

listingRouter.get('/', validateRequest({ query: listListingsQuerySchema }), asyncHandler(listListings));
listingRouter.post('/', verifyFirebaseToken, loadLocalUser, requireAuthenticated, requireRole('dealer'),
  validateRequest({ body: createListingBodySchema }), asyncHandler(createListing));
listingRouter.get('/:listingId', validateRequest({ params: listingIdParamsSchema }), asyncHandler(getListing));
