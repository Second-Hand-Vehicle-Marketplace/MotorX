import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import { getMyDealerApplication, getPendingDealerApplications, reviewDealerApplication, submitDealerApplication } from './dealer.service.js';
import type { CreateDealerApplicationBody } from './dealer.validation.js';

// Handles submission of a buyer's dealer application.
export async function createApplication(request: AuthenticatedRequest, response: Response) {
  const dealer = await submitDealerApplication(request.localUser!._id, request.localUser!.role, request.body as CreateDealerApplicationBody);
  sendSuccess(response, dealer, { status: 201 });
}
// Returns the authenticated user's application.
export async function getMyApplication(request: AuthenticatedRequest, response: Response) {
  sendSuccess(response, await getMyDealerApplication(request.localUser!._id));
}
// Returns pending applications to administrators.
export async function listPendingApplications(_request: AuthenticatedRequest, response: Response) {
  sendSuccess(response, await getPendingDealerApplications());
}
// Approves a pending application and promotes its user.
export async function approveApplication(request: AuthenticatedRequest, response: Response) {
  sendSuccess(response, await reviewDealerApplication(String(request.params.dealerId), request.localUser!._id, 'approved'));
}
// Rejects a pending application with the supplied reason.
export async function rejectApplication(request: AuthenticatedRequest, response: Response) {
  sendSuccess(response, await reviewDealerApplication(String(request.params.dealerId), request.localUser!._id, 'rejected', request.body.reason));
}
