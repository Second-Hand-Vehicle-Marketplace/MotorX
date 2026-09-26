import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { dealerApplicationLimiter, uploadConcurrencyGate } from '../../shared/middleware/rateLimits.js';
import { createApplication, getMyApplication, updateMyProfile } from './dealer.controller.js';
import { createDealerApplicationSchema, updateDealerProfileSchema } from './dealer.validation.js';
import { uploadDealerDocuments } from './dealerDocument.middleware.js';

const authenticated = [verifyFirebaseToken, loadLocalUser, requireAuthenticated] as const;
export const dealerRouter = Router();

// A rejected applicant corrects and resubmits through the same endpoint (see submitDealerApplication).
dealerRouter.post('/applications', ...authenticated, requireRole('buyer'), dealerApplicationLimiter, uploadConcurrencyGate, uploadDealerDocuments, validateRequest({ body: createDealerApplicationSchema }), asyncHandler(createApplication));
dealerRouter.get('/me', ...authenticated, asyncHandler(getMyApplication));
dealerRouter.patch('/me/profile', ...authenticated, requireRole('dealer'), validateRequest({ body: updateDealerProfileSchema }), asyncHandler(updateMyProfile));

