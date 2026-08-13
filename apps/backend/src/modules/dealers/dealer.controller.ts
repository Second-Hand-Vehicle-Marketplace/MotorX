import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { getMyDealerApplication, getPendingDealerApplications, reviewDealerApplication, submitDealerApplication } from './dealer.service.js';
import type { CreateDealerApplicationBody } from './dealer.validation.js';

export async function createApplication(request: AuthenticatedRequest, response: Response) {
  const dealer = await submitDealerApplication(request.localUser!._id, request.localUser!.role, request.body as CreateDealerApplicationBody);
  response.status(201).json({ success: true, data: dealer, meta: null });
}
export async function getMyApplication(request: AuthenticatedRequest, response: Response) {
  response.json({ success: true, data: await getMyDealerApplication(request.localUser!._id), meta: null });
}
export async function listPendingApplications(_request: AuthenticatedRequest, response: Response) {
  response.json({ success: true, data: await getPendingDealerApplications(), meta: null });
}
export async function approveApplication(request: AuthenticatedRequest, response: Response) {
  response.json({ success: true, data: await reviewDealerApplication(String(request.params.dealerId), request.localUser!._id, 'approved'), meta: null });
}
export async function rejectApplication(request: AuthenticatedRequest, response: Response) {
  response.json({ success: true, data: await reviewDealerApplication(String(request.params.dealerId), request.localUser!._id, 'rejected', request.body.reason), meta: null });
}
