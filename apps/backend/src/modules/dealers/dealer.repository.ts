import type { ClientSession, Types } from 'mongoose';
import { AuthUserModel } from '../auth-users/authUser.model.js';
import { DealerModel, type DealerApplicationStatus } from './dealer.model.js';
import type { CreateDealerApplicationBody } from './dealer.validation.js';

// Finds the single dealer application belonging to a user.
export const findDealerByUserId = (userId: Types.ObjectId) => DealerModel.findOne({ userId }).lean();
// Loads an application, optionally within an approval transaction.
export const findDealerById = (dealerId: string, session?: ClientSession) => DealerModel.findById(dealerId).session(session ?? null);
// Creates a pending dealer application for a buyer.
export const createDealer = (userId: Types.ObjectId, input: CreateDealerApplicationBody) => DealerModel.create({ userId, ...input });
// Lists applications by review status in submission order.
export const listDealersByStatus = (status: DealerApplicationStatus = 'pending') => DealerModel.find({ status }).sort({ createdAt: 1 }).lean();

// Records an admin decision only while the application is still pending.
export function updateDealerReview(dealerId: string, status: 'approved' | 'rejected', adminId: Types.ObjectId, rejectionReason: string | undefined, session: ClientSession) {
  return DealerModel.findOneAndUpdate({ _id: dealerId, status: 'pending' }, {
    $set: { status, reviewedBy: adminId, reviewedAt: new Date(), ...(rejectionReason ? { rejectionReason } : {}) },
    ...(status === 'approved' ? { $unset: { rejectionReason: 1 } } : {}),
  }, { new: true, runValidators: true, session });
}

// Grants the dealer role within the same transaction as approval.
export function promoteUserToDealer(userId: Types.ObjectId, session: ClientSession) {
  return AuthUserModel.findByIdAndUpdate(userId, { $set: { role: 'dealer' } }, { new: true, session });
}
