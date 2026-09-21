import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { downloadInventoryCsvTemplate, getMyInventoryUpload, listMyInventoryUploads, listMyUploadRejectedRecords, uploadDealerInventory, uploadDealerInventoryImages } from './inventory.controller.js';
import { uploadSingleImagesZip, uploadSingleInventoryCsv } from './inventory.middleware.js';
import { csvTemplateParamsSchema, inventoryUploadIdParamsSchema, listInventoryUploadsQuerySchema, listRejectedRecordsQuerySchema, uploadCategoryBodySchema } from './inventory.validation.js';

export const inventoryRouter = Router();
inventoryRouter.use(verifyFirebaseToken, loadLocalUser, requireAuthenticated, requireRole('dealer'));
inventoryRouter.get('/template/:category', validateRequest({ params: csvTemplateParamsSchema }), asyncHandler(downloadInventoryCsvTemplate));
// uploadSingleInventoryCsv (multer) must run before body validation: it's what populates
// request.body from the multipart form in the first place.
inventoryRouter.post('/', uploadSingleInventoryCsv, validateRequest({ body: uploadCategoryBodySchema }), asyncHandler(uploadDealerInventory));
inventoryRouter.get('/', validateRequest({ query: listInventoryUploadsQuerySchema }), asyncHandler(listMyInventoryUploads));
inventoryRouter.get('/:uploadId', validateRequest({ params: inventoryUploadIdParamsSchema }), asyncHandler(getMyInventoryUpload));
inventoryRouter.get('/:uploadId/rejected-records', validateRequest({ params: inventoryUploadIdParamsSchema, query: listRejectedRecordsQuerySchema }), asyncHandler(listMyUploadRejectedRecords));
inventoryRouter.post('/:uploadId/images', validateRequest({ params: inventoryUploadIdParamsSchema }), uploadSingleImagesZip, asyncHandler(uploadDealerInventoryImages));
