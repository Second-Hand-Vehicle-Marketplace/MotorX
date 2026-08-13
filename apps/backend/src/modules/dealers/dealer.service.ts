import mongoose, { type Types } from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import type { Dealer } from './dealer.model.js';
import { createDealer, findDealerById, findDealerByUserId, listDealersByStatus, promoteUserToDealer, updateDealerReview } from './dealer.repository.js';
import type { CreateDealerApplicationBody } from './dealer.validation.js';

function serializeDealer(dealer: Dealer & { _id: Types.ObjectId }) {
  return {
    id: dealer._id.toString(), userId: dealer.userId.toString(), businessName: dealer.businessName,
    registrationNumber: dealer.registrationNumber, phone: dealer.phone, address: dealer.address,
    status: dealer.status, rejectionReason: dealer.rejectionReason ?? null,
    reviewedBy: dealer.reviewedBy?.toString() ?? null, reviewedAt: dealer.reviewedAt?.toISOString() ?? null,
    createdAt: dealer.createdAt.toISOString(), updatedAt: dealer.updatedAt.toISOString(),
  };
}

export async function submitDealerApplication(userId: Types.ObjectId, role: string, input: CreateDealerApplicationBody) {
  if (role !== 'buyer') throw new AppError(409, errorCodes.conflict, 'Only buyer accounts can submit a dealer application.');
  if (await findDealerByUserId(userId)) throw new AppError(409, errorCodes.conflict, 'A dealer application already exists for this account.');
  try { return serializeDealer((await createDealer(userId, input)).toObject() as Dealer & { _id: Types.ObjectId }); }
  catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)
      throw new AppError(409, errorCodes.conflict, 'This account or registration number already has an application.');
    throw error;
  }
}

export async function getMyDealerApplication(userId: Types.ObjectId) {
  const dealer = await findDealerByUserId(userId);
  if (!dealer) throw new AppError(404, errorCodes.notFound, 'No dealer application was found for this account.');
  return serializeDealer(dealer as unknown as Dealer & { _id: Types.ObjectId });
}

export async function getPendingDealerApplications() {
  const dealers = await listDealersByStatus('pending');
  return dealers.map((dealer) => serializeDealer(dealer as unknown as Dealer & { _id: Types.ObjectId }));
}

export async function reviewDealerApplication(dealerId: string, adminId: Types.ObjectId, decision: 'approved' | 'rejected', reason?: string) {
  const session = await mongoose.startSession();
  let result: ReturnType<typeof serializeDealer> | undefined;
  try {
    await session.withTransaction(async () => {
      const existing = await findDealerById(dealerId, session);
      if (!existing) throw new AppError(404, errorCodes.notFound, 'The dealer application was not found.');
      if (existing.status !== 'pending') throw new AppError(409, errorCodes.conflict, 'This dealer application has already been reviewed.');
      const updated = await updateDealerReview(dealerId, decision, adminId, reason, session);
      if (!updated) throw new AppError(409, errorCodes.conflict, 'This dealer application has already been reviewed.');
      if (decision === 'approved' && !(await promoteUserToDealer(updated.userId, session)))
        throw new AppError(404, errorCodes.notFound, 'The applicant user account was not found.');
      result = serializeDealer(updated.toObject() as Dealer & { _id: Types.ObjectId });
    });
  } finally { await session.endSession(); }
  if (!result) throw new AppError(500, errorCodes.internal, 'The dealer review could not be completed.');
  return result;
}
