import { Router } from 'express';
import {
  getSystemHealth,
  getAuditLogs,
  getUsers,
  getListings,
  getUploadJobs,
  updateUserStatus,
  updateDealerStatus,
  updateListingStatus,
  deleteListing,
} from './admin.controller.js';

export const adminRouter = Router();

adminRouter.get('/system-health', getSystemHealth);
adminRouter.get('/audit-logs', getAuditLogs);
adminRouter.get('/users', getUsers);
adminRouter.get('/listings', getListings);
adminRouter.get('/uploads', getUploadJobs);
adminRouter.patch('/users/:id/status', updateUserStatus);
adminRouter.patch('/dealers/:id/status', updateDealerStatus);
adminRouter.patch('/listings/:id/status', updateListingStatus);
adminRouter.delete('/listings/:id', deleteListing);
