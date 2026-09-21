import type { Types } from 'mongoose';
import { DealerModel } from './dealer.model.js';
import type { CreateDealerApplicationBody } from './dealer.validation.js';

// Finds the single dealer application belonging to a user.
export const findDealerByUserId = (userId: Types.ObjectId) => DealerModel.findOne({ userId }).lean();
// Creates a pending dealer application for a buyer.
export const createDealer = (userId: Types.ObjectId, input: CreateDealerApplicationBody & { verificationDocuments: Array<{ category: 'businessRegistration' | 'identityProof' | 'additionalDocument'; key: string; originalName: string; contentType: string; size: number }> }) => DealerModel.create({ userId, ...input });
