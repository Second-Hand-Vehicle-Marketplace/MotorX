import type { Types } from 'mongoose';
import { DealerModel, type Dealer } from './dealer.model.js';
import type { CreateDealerApplicationBody, UpdateDealerProfileBody } from './dealer.validation.js';

type StoredDocuments = Dealer['verificationDocuments'];

// Finds the single dealer application belonging to a user.
export const findDealerByUserId = (userId: Types.ObjectId) => DealerModel.findOne({ userId }).lean();
// Creates a pending dealer application for a buyer.
export const createDealer = (userId: Types.ObjectId, input: CreateDealerApplicationBody & { verificationDocuments: StoredDocuments }) => DealerModel.create({ userId, ...input });

// Replaces a rejected application with the corrected one and sends it back for review. The
// earlier decision moves to reviewHistory. Matching on status 'rejected' turns a concurrent
// double submission (or one after approval) into a no-op that returns null.
export const resubmitRejectedApplication = (
  previous: Pick<Dealer, 'rejectionReason' | 'reviewedBy' | 'reviewedAt' | 'submittedAt' | 'createdAt'> & { _id: Types.ObjectId },
  input: CreateDealerApplicationBody & { verificationDocuments: StoredDocuments },
) => DealerModel.findOneAndUpdate(
  { _id: previous._id, status: 'rejected' },
  {
    $set: { ...input, status: 'pending', submittedAt: new Date() },
    $unset: {
      rejectionReason: 1, reviewedBy: 1, reviewedAt: 1, documentsDeletedAt: 1,
      // Optional fields left empty in the corrected application must not keep their old values.
      ...(input.website ? {} : { website: 1 }), ...(input.inventoryCount === undefined ? { inventoryCount: 1 } : {}),
    },
    $push: { reviewHistory: { status: 'rejected', reason: previous.rejectionReason, reviewedBy: previous.reviewedBy, reviewedAt: previous.reviewedAt, submittedAt: previous.submittedAt ?? previous.createdAt } },
  },
  { new: true, runValidators: true },
);

// Updates an approved dealer's editable business details (website '' removes the website).
export const updateApprovedDealerProfile = (userId: Types.ObjectId, input: UpdateDealerProfileBody) => {
  const { website, ...rest } = input;
  return DealerModel.findOneAndUpdate(
    { userId, status: 'approved' },
    { $set: { ...rest, ...(website ? { website } : {}) }, ...(website === '' ? { $unset: { website: 1 } } : {}) },
    { new: true, runValidators: true },
  ).lean();
};
