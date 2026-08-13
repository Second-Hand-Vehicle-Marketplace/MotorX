import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { approveApplication, createApplication, getMyApplication, listPendingApplications, rejectApplication } from './dealer.controller.js';
import { createDealerApplicationSchema, dealerIdParamsSchema, rejectionBodySchema } from './dealer.validation.js';

const authenticated = [verifyFirebaseToken, loadLocalUser, requireAuthenticated] as const;
export const dealerRouter = Router();
export const adminDealerRouter = Router();

dealerRouter.post('/applications', ...authenticated, requireRole('buyer'), validateRequest({ body: createDealerApplicationSchema }), asyncHandler(createApplication));
dealerRouter.get('/me', ...authenticated, asyncHandler(getMyApplication));

adminDealerRouter.use(...authenticated, requireRole('admin'));
adminDealerRouter.get('/', asyncHandler(listPendingApplications));
adminDealerRouter.patch('/:dealerId/approve', validateRequest({ params: dealerIdParamsSchema }), asyncHandler(approveApplication));
adminDealerRouter.patch('/:dealerId/reject', validateRequest({ params: dealerIdParamsSchema, body: rejectionBodySchema }), asyncHandler(rejectApplication));
