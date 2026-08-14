import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { approveApplication, createApplication, getApplicationDocument, getMyApplication, listPendingApplications, rejectApplication } from './dealer.controller.js';
import { createDealerApplicationSchema, dealerIdParamsSchema, rejectionBodySchema } from './dealer.validation.js';
import { uploadDealerDocuments } from './dealerDocument.middleware.js';
import { z } from 'zod';

const authenticated = [verifyFirebaseToken, loadLocalUser, requireAuthenticated] as const;
export const dealerRouter = Router();
export const adminDealerRouter = Router();

dealerRouter.post('/applications', ...authenticated, requireRole('buyer'), uploadDealerDocuments, validateRequest({ body: createDealerApplicationSchema }), asyncHandler(createApplication));
dealerRouter.get('/me', ...authenticated, asyncHandler(getMyApplication));

adminDealerRouter.use(...authenticated, requireRole('admin'));
adminDealerRouter.get('/', asyncHandler(listPendingApplications));
adminDealerRouter.get('/:dealerId/documents/:documentIndex', validateRequest({
  params: dealerIdParamsSchema.extend({ documentIndex: z.coerce.number().int().min(0).max(2) }),
}), asyncHandler(getApplicationDocument));
adminDealerRouter.patch('/:dealerId/approve', validateRequest({ params: dealerIdParamsSchema }), asyncHandler(approveApplication));
adminDealerRouter.patch('/:dealerId/reject', validateRequest({ params: dealerIdParamsSchema, body: rejectionBodySchema }), asyncHandler(rejectApplication));
