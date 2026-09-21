import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { createApplication, getMyApplication } from './dealer.controller.js';
import { createDealerApplicationSchema } from './dealer.validation.js';
import { uploadDealerDocuments } from './dealerDocument.middleware.js';

const authenticated = [verifyFirebaseToken, loadLocalUser, requireAuthenticated] as const;
export const dealerRouter = Router();

dealerRouter.post('/applications', ...authenticated, requireRole('buyer'), uploadDealerDocuments, validateRequest({ body: createDealerApplicationSchema }), asyncHandler(createApplication));
dealerRouter.get('/me', ...authenticated, asyncHandler(getMyApplication));

