import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import { getMyDealerApplication, submitDealerApplication } from './dealer.service.js';
import type { CreateDealerApplicationBody } from './dealer.validation.js';
import { deleteDealerDocuments, storeDealerDocuments } from './dealerDocument.storage.js';

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

// Returns the authenticated user's application.
export async function getMyApplication(request: AuthenticatedRequest, response: Response) {
  sendSuccess(response, await getMyDealerApplication(request.localUser!._id));
}
