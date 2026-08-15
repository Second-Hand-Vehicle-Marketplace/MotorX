import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { getMyInventoryUpload, listMyInventoryUploads, uploadDealerInventory } from './inventory.controller.js';
import { uploadSingleInventoryCsv } from './inventory.middleware.js';
import { inventoryUploadIdParamsSchema, listInventoryUploadsQuerySchema } from './inventory.validation.js';

export const inventoryRouter = Router();
inventoryRouter.use(verifyFirebaseToken, loadLocalUser, requireAuthenticated, requireRole('dealer'));
inventoryRouter.post('/', uploadSingleInventoryCsv, asyncHandler(uploadDealerInventory));
inventoryRouter.get('/', validateRequest({ query: listInventoryUploadsQuerySchema }), asyncHandler(listMyInventoryUploads));
inventoryRouter.get('/:uploadId', validateRequest({ params: inventoryUploadIdParamsSchema }), asyncHandler(getMyInventoryUpload));
