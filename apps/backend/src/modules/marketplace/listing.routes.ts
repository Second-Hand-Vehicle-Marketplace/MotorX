import { Router } from 'express';
import { listingPhotoLimiter, uploadConcurrencyGate } from '../../shared/middleware/rateLimits.js';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { bulkUpdateListings, createListing, deleteListing, getMyListing, getMyListingStats, listMyListings, updateListing, updateListingStatus } from './listing.controller.js';
import { bulkListingActionBodySchema, createListingBodySchema, listingIdParamsSchema, listMyListingsQuerySchema, updateListingBodySchema, updateListingStatusBodySchema } from './listing.validation.js';
import { listingImageKeyParamsSchema, listingImageMetadataSchema, publicListingImageKeyParamsSchema, reorderListingImagesBodySchema } from './listing.validation.js';
import { uploadSingleListingImage } from './listingImage.middleware.js';
import { addListingImage, deleteListingImage, getListingImageFile, getListingThumbFile, reorderListingImages } from './listingImage.controller.js';

export const listingRouter = Router();
export const listingImageRouter = Router();
const dealerOnly = [verifyFirebaseToken, loadLocalUser, requireAuthenticated, requireRole('dealer')] as const;

listingRouter.get('/mine', ...dealerOnly, validateRequest({ query: listMyListingsQuerySchema }), asyncHandler(listMyListings));
listingRouter.post('/mine/bulk', ...dealerOnly, validateRequest({ body: bulkListingActionBodySchema }), asyncHandler(bulkUpdateListings));
listingRouter.get('/mine/stats', ...dealerOnly, asyncHandler(getMyListingStats));
listingRouter.get('/mine/:listingId', ...dealerOnly, validateRequest({ params: listingIdParamsSchema }), asyncHandler(getMyListing));
listingRouter.post('/', ...dealerOnly, validateRequest({ body: createListingBodySchema }), asyncHandler(createListing));
listingRouter.patch('/:listingId', ...dealerOnly, validateRequest({ params: listingIdParamsSchema, body: updateListingBodySchema }), asyncHandler(updateListing));
listingRouter.patch('/:listingId/status', ...dealerOnly, validateRequest({ params: listingIdParamsSchema, body: updateListingStatusBodySchema }), asyncHandler(updateListingStatus));
listingRouter.delete('/:listingId', ...dealerOnly, validateRequest({ params: listingIdParamsSchema }), asyncHandler(deleteListing));
listingRouter.post('/:listingId/images', ...dealerOnly, validateRequest({ params: listingIdParamsSchema }), uploadConcurrencyGate, listingPhotoLimiter, uploadSingleListingImage,
  validateRequest({ body: listingImageMetadataSchema }), asyncHandler(addListingImage));
listingRouter.delete('/:listingId/images/:imageKey', ...dealerOnly,
  validateRequest({ params: listingImageKeyParamsSchema }), asyncHandler(deleteListingImage));
listingRouter.patch('/:listingId/images/reorder', ...dealerOnly,
  validateRequest({ params: listingIdParamsSchema, body: reorderListingImagesBodySchema }), asyncHandler(reorderListingImages));

listingImageRouter.get('/thumbs/:imageKey', validateRequest({ params: publicListingImageKeyParamsSchema }), asyncHandler(getListingThumbFile));
listingImageRouter.get('/:imageKey', validateRequest({ params: publicListingImageKeyParamsSchema }), asyncHandler(getListingImageFile));
