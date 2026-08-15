import { Router } from 'express';
import { loadLocalUser } from '../../shared/middleware/loadLocalUser.js';
import { requireAuthenticated } from '../../shared/middleware/requireAuthenticated.js';
import { requireRole } from '../../shared/middleware/requireRole.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { verifyFirebaseToken } from '../../shared/middleware/verifyFirebaseToken.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { adminDealerDocumentParamsSchema, adminDealerIdParamsSchema, adminListingIdParamsSchema, adminUserIdParamsSchema, listAdminAuditQuerySchema, listAdminListingsQuerySchema, listAdminUploadsQuerySchema, listAdminUsersQuerySchema, rejectDealerApplicationBodySchema, updateAdminUserBodySchema } from './admin.validation.js';
import { approveAdminDealerApplication, getAdminAuditLogs, getAdminDashboardStats, getAdminDealerApplications, getAdminDealerDocument, getAdminListings, getAdminSystemHealth, getAdminUploads, getAdminUsers, patchAdminUser, rejectAdminDealerApplication, removeAdminListing } from './admin.controller.js';

export const adminRouter = Router();

// Every route in this module requires an active local administrator account.
adminRouter.use(verifyFirebaseToken, loadLocalUser, requireAuthenticated, requireRole('admin'));
adminRouter.get('/users', validateRequest({ query: listAdminUsersQuerySchema }), asyncHandler(getAdminUsers));
adminRouter.patch('/users/:userId', validateRequest({ params: adminUserIdParamsSchema, body: updateAdminUserBodySchema }), asyncHandler(patchAdminUser));
adminRouter.get('/listings', validateRequest({ query: listAdminListingsQuerySchema }), asyncHandler(getAdminListings));
adminRouter.delete('/listings/:listingId', validateRequest({ params: adminListingIdParamsSchema }), asyncHandler(removeAdminListing));
adminRouter.get('/stats', asyncHandler(getAdminDashboardStats));
adminRouter.get('/audit-logs', validateRequest({ query: listAdminAuditQuerySchema }), asyncHandler(getAdminAuditLogs));
adminRouter.get('/uploads', validateRequest({ query: listAdminUploadsQuerySchema }), asyncHandler(getAdminUploads));
adminRouter.get('/system-health', asyncHandler(getAdminSystemHealth));
adminRouter.get('/dealer-applications', asyncHandler(getAdminDealerApplications));
adminRouter.get('/dealer-applications/:dealerId/documents/:documentIndex', validateRequest({ params: adminDealerDocumentParamsSchema }), asyncHandler(getAdminDealerDocument));
adminRouter.patch('/dealer-applications/:dealerId/approve', validateRequest({ params: adminDealerIdParamsSchema }), asyncHandler(approveAdminDealerApplication));
adminRouter.patch('/dealer-applications/:dealerId/reject', validateRequest({ params: adminDealerIdParamsSchema, body: rejectDealerApplicationBodySchema }), asyncHandler(rejectAdminDealerApplication));
