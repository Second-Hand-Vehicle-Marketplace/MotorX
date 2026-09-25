import type { Types } from 'mongoose';
import type { DealerApplicationDto } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { notifyDealerApplicationSubmitted } from '../notifications/notification.service.js';
import type { Dealer } from './dealer.model.js';
import { createDealer, findDealerByUserId, resubmitDealer, updateApprovedDealerProfile } from './dealer.repository.js';
import type { CreateDealerApplicationBody, UpdateDealerProfileBody } from './dealer.validation.js';
import type { StoredDealerDocument } from './dealerDocument.storage.js';

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
    reviewHistory: (dealer.reviewHistory ?? []).map((review) => ({ status: review.status, reason: review.reason ?? null, reviewedBy: review.reviewedBy?.toString() ?? null, reviewedAt: review.reviewedAt.toISOString() })),
    createdAt: dealer.createdAt.toISOString(), updatedAt: dealer.updatedAt.toISOString(),
  };
}

// Creates one unique application for an eligible buyer account.
export async function submitDealerApplication(userId: Types.ObjectId, role: string, input: CreateDealerApplicationBody, verificationDocuments: StoredDealerDocument[]) {
  if (role !== 'buyer') throw new AppError(409, errorCodes.conflict, 'Only buyer accounts can submit a dealer application.');
  const existing = await findDealerByUserId(userId);
  if (existing && existing.status !== 'rejected') throw new AppError(409, errorCodes.conflict, 'A dealer application already exists for this account.');
  try {
    const saved = existing
      ? await resubmitDealer(userId, { ...input, verificationDocuments })
      : await createDealer(userId, { ...input, verificationDocuments });
    if (!saved) throw new AppError(409, errorCodes.conflict, 'This dealer application can no longer be resubmitted.');
    const dealer = serializeDealer(saved.toObject() as Dealer & { _id: Types.ObjectId });
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

export async function updateMyDealerProfile(userId: Types.ObjectId, input: UpdateDealerProfileBody) {
  const dealer = await updateApprovedDealerProfile(userId, input);
  if (!dealer) throw new AppError(409, errorCodes.conflict, 'Only approved dealer profiles can be updated.');
  return serializeDealer(dealer.toObject() as Dealer & { _id: Types.ObjectId });
}

