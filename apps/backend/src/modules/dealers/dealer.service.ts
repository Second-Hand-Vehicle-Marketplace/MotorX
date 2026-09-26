import type { Types } from 'mongoose';
import type { DealerApplicationDto } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { notifyDealerApplicationSubmitted } from '../notifications/notification.service.js';
import type { Dealer } from './dealer.model.js';
import { createDealer, findDealerByUserId, resubmitRejectedApplication, updateApprovedDealerProfile } from './dealer.repository.js';
import type { CreateDealerApplicationBody, UpdateDealerProfileBody } from './dealer.validation.js';
import { deleteDealerDocuments, type StoredDealerDocument } from './dealerDocument.storage.js';

// Submission time and earlier rejections, shared by the dealer and admin representations.
export function serializeReviewState(dealer: Pick<Dealer, 'submittedAt' | 'reviewHistory' | 'createdAt'>) {
  return {
    submittedAt: (dealer.submittedAt ?? dealer.createdAt).toISOString(),
    reviewHistory: (dealer.reviewHistory ?? []).map((entry) => ({ status: entry.status, reason: entry.reason ?? null, reviewedAt: entry.reviewedAt?.toISOString() ?? null, submittedAt: entry.submittedAt?.toISOString() ?? null })),
  };
}

// Converts a MongoDB dealer record into the public API contract.
function serializeDealer(dealer: Dealer & { _id: Types.ObjectId }): DealerApplicationDto {
  return {
    id: dealer._id.toString(), userId: dealer.userId.toString(), businessName: dealer.businessName,
    registrationNumber: dealer.registrationNumber, phone: dealer.phone, address: dealer.address,
    representativeName: dealer.representativeName ?? 'Not provided', city: dealer.city ?? 'Not provided', province: dealer.province ?? 'Not provided',
    businessPhone: dealer.businessPhone ?? dealer.phone, businessEmail: dealer.businessEmail ?? 'Not provided',
    website: dealer.website ?? null, dealershipType: dealer.dealershipType ?? 'used', brands: dealer.brands ?? [],
    description: dealer.description ?? 'This application was submitted before the expanded dealer profile was introduced.',
    inventoryCount: dealer.inventoryCount ?? null,
    verificationDocuments: dealer.verificationDocuments ?? [],
    status: dealer.status, rejectionReason: dealer.rejectionReason ?? null,
    reviewedBy: dealer.reviewedBy?.toString() ?? null, reviewedAt: dealer.reviewedAt?.toISOString() ?? null,
    documentsDeletedAt: dealer.documentsDeletedAt?.toISOString() ?? null,
    ...serializeReviewState(dealer),
    createdAt: dealer.createdAt.toISOString(), updatedAt: dealer.updatedAt.toISOString(),
  };
}

// Creates a buyer's dealer application or, after a rejection, replaces it with the corrected
// version: the earlier decision is kept in reviewHistory and its documents are deleted.
export async function submitDealerApplication(userId: Types.ObjectId, role: string, input: CreateDealerApplicationBody, verificationDocuments: StoredDealerDocument[]) {
  if (role !== 'buyer') throw new AppError(409, errorCodes.conflict, 'Only buyer accounts can submit a dealer application.');
  const existing = await findDealerByUserId(userId);
  if (existing?.status === 'pending') throw new AppError(409, errorCodes.conflict, 'Your dealer application is already waiting for review.');
  if (existing && existing.status !== 'rejected') throw new AppError(409, errorCodes.conflict, 'A dealer application already exists for this account.');
  try {
    if (existing) {
      const resubmitted = await resubmitRejectedApplication(existing as unknown as Dealer & { _id: Types.ObjectId }, { ...input, verificationDocuments });
      if (!resubmitted) throw new AppError(409, errorCodes.conflict, 'This application was already resubmitted or reviewed.');
      await deleteDealerDocuments(existing.verificationDocuments ?? []); // replaced; never needed again
      const dealer = serializeDealer(resubmitted.toObject() as Dealer & { _id: Types.ObjectId });
      await notifyDealerApplicationSubmitted(dealer.businessName, true);
      return dealer;
    }
    const dealer = serializeDealer((await createDealer(userId, { ...input, verificationDocuments })).toObject() as Dealer & { _id: Types.ObjectId });
    await notifyDealerApplicationSubmitted(dealer.businessName);
    return dealer;
  }
  catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)
      throw new AppError(409, errorCodes.conflict, 'This account or registration number already has an application.');
    throw error;
  }
}

// Returns the current user's dealer application and review state.
export async function getMyDealerApplication(userId: Types.ObjectId) {
  const dealer = await findDealerByUserId(userId);
  if (!dealer) throw new AppError(404, errorCodes.notFound, 'No dealer application was found for this account.');
  return serializeDealer(dealer as unknown as Dealer & { _id: Types.ObjectId });
}


// Lets an approved dealer keep their public business details current (FR-DEALER-03).
export async function updateMyDealerProfile(userId: Types.ObjectId, input: UpdateDealerProfileBody) {
  const dealer = await updateApprovedDealerProfile(userId, input);
  if (!dealer) throw new AppError(404, errorCodes.notFound, 'No approved dealer profile was found for this account.');
  return serializeDealer(dealer as unknown as Dealer & { _id: Types.ObjectId });
}
