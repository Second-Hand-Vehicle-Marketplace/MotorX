import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import { getMyDealerApplication, getPendingDealerApplications, reviewDealerApplication, submitDealerApplication } from './dealer.service.js';
import type { CreateDealerApplicationBody } from './dealer.validation.js';
import { deleteDealerDocuments, readDealerDocument, storeDealerDocuments } from './dealerDocument.storage.js';
import { findDealerById } from './dealer.repository.js';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';

// Handles submission of a buyer's dealer application.
export async function createApplication(request: AuthenticatedRequest, response: Response) {
  const grouped = request.files as Record<string, Express.Multer.File[]>;
  const files = (['businessRegistration', 'identityProof', 'additionalDocument'] as const)
    .flatMap((category) => grouped[category]?.map((file) => ({ category, file })) ?? []);
  const documents = await storeDealerDocuments(request.localUser!._id.toString(), files);
  try {
    const dealer = await submitDealerApplication(request.localUser!._id, request.localUser!.role, request.body as CreateDealerApplicationBody, documents);
    sendSuccess(response, dealer, { status: 201 });
  } catch (error) {
    await deleteDealerDocuments(documents);
    throw error;
  }
}

export async function getApplicationDocument(request: AuthenticatedRequest, response: Response) {
  const dealer = await findDealerById(String(request.params.dealerId));
  if (!dealer) throw new AppError(404, errorCodes.notFound, 'The dealer application was not found.');
  const document = dealer.verificationDocuments[Number(request.params.documentIndex)];
  if (!document) throw new AppError(404, errorCodes.notFound, 'The verification document was not found.');
  const stored = await readDealerDocument(document.key);
  response.setHeader('Content-Type', stored.contentType);
  response.setHeader('Content-Disposition', `inline; filename="${document.originalName.replace(/["\r\n]/g, '_')}"`);
  response.send(stored.bytes);
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
