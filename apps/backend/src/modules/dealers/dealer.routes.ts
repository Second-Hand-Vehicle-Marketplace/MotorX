import { Router } from 'express';
import {
  approveDealerApplication,
  getDealerApplications,
  rejectDealerApplication,
  registerDealerApplication,
} from './dealer.controller.js';

export const dealerRoutes = Router();

dealerRoutes.post('/register', registerDealerApplication);
dealerRoutes.get('/applications', getDealerApplications);
dealerRoutes.patch('/applications/:id/approve', approveDealerApplication);
dealerRoutes.patch('/applications/:id/reject', rejectDealerApplication);
