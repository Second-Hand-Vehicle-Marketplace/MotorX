import type { FilterQuery } from 'mongoose';
import { AuthUserModel, type AuthUser } from '../auth-users/authUser.model.js';
import { DealerModel } from '../dealers/dealer.model.js';
import { ListingModel, type Listing } from '../marketplace/listing.model.js';
import { UploadJobModel } from '../inventory/uploadJob.model.js';
import { AdminAuditLogModel, type AdminAuditEvent } from './admin.model.js';
import type { ClientSession, Types } from 'mongoose';
import type { ListAdminAuditQuery, ListAdminDealerApplicationsQuery, ListAdminListingsQuery, ListAdminUploadsQuery, ListAdminUsersQuery } from './admin.validation.js';

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Builds a bounded user query without exposing raw search input to regex syntax.
export async function listAdminUsers(options: ListAdminUsersQuery) {
  const filter: FilterQuery<AuthUser> = {};
  if (options.role) filter.role = options.role;
  if (options.status) filter.status = options.status;
  if (options.search) {
    const search = new RegExp(escapeRegex(options.search), 'i');
    filter.$or = [{ displayName: search }, { email: search }];
  }
  const [documents, total] = await Promise.all([
    AuthUserModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((options.page - 1) * options.limit).limit(options.limit).lean(),
    AuthUserModel.countDocuments(filter),
  ]);
  return { documents, total };
}

export function updateAdminUserStatus(userId: string, status: 'active' | 'suspended', session?: ClientSession) {
  return AuthUserModel.findByIdAndUpdate(userId, { $set: { status } }, { new: true, runValidators: true, session }).lean();
}

// Includes dealer identity so administrators can moderate across dealerships.
export async function listAdminListings(options: ListAdminListingsQuery) {
  const filter: FilterQuery<Listing> = {};
  if (options.status) filter.status = options.status;
  if (options.category) filter.category = options.category;
  if (options.search) {
    const search = new RegExp(escapeRegex(options.search), 'i');
    filter.$or = [{ title: search }, { make: search }, { model: search }];
  }
  const [documents, total] = await Promise.all([
    ListingModel.find(filter).populate('dealerId', 'displayName email').sort({ createdAt: -1, _id: -1 })
      .skip((options.page - 1) * options.limit).limit(options.limit).lean(),
    ListingModel.countDocuments(filter),
  ]);
  return { documents, total };
}

// Soft removal preserves the listing for later audit inspection.
export function archiveListingByAdmin(listingId: string, session?: ClientSession) {
  return ListingModel.findByIdAndUpdate(listingId, { $set: { status: 'archived' } }, { new: true, runValidators: true, session })
    .populate('dealerId', 'displayName email').lean();
}

// Independent counts run together to minimize dashboard latency.
export async function getAdminStats() {
  const [totalUsers, activeDealers, totalListings, activeListings, pendingDealerApplications] = await Promise.all([
    AuthUserModel.countDocuments(),
    AuthUserModel.countDocuments({ role: 'dealer', status: 'active' }),
    ListingModel.countDocuments(),
    ListingModel.countDocuments({ status: 'active' }),
    DealerModel.countDocuments({ status: 'pending' }),
  ]);
  return { totalUsers, activeDealers, registeredDealers: activeDealers, totalListings, activeListings, pendingDealerApplications };
}

export function createAdminAuditLog(input: { eventType: AdminAuditEvent; actorId: Types.ObjectId; targetId: Types.ObjectId; targetName: string; details: string }, session?: ClientSession) {
  return AdminAuditLogModel.create([input], { session }).then(([record]) => record);
}

// createdAt condition for an inclusive YYYY-MM-DD date range (UTC days).
function createdWithin(from?: string, to?: string) {
  if (!from && !to) return {};
  return { createdAt: { ...(from ? { $gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { $lt: new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 86_400_000) } : {}) } };
}

export async function listAdminAuditLogs(options: ListAdminAuditQuery) {
  const filter = { ...(options.eventType ? { eventType: options.eventType } : {}), ...createdWithin(options.from, options.to) };
  const [documents, total] = await Promise.all([
    AdminAuditLogModel.find(filter).populate('actorId', 'displayName email').sort({ createdAt: -1, _id: -1 }).skip((options.page - 1) * options.limit).limit(options.limit).lean(),
    AdminAuditLogModel.countDocuments(filter),
  ]);
  return { documents, total };
}

export async function listAdminUploads(options: ListAdminUploadsQuery) {
  const filter = options.uploadId
    ? { _id: options.uploadId }
    : { ...(options.status ? { status: options.status } : {}), ...(options.dealerId ? { dealerId: options.dealerId } : {}), ...createdWithin(options.from, options.to) };
  const [documents, total] = await Promise.all([
    UploadJobModel.find(filter).populate('dealerId', 'displayName email').sort({ createdAt: -1, _id: -1 }).skip((options.page - 1) * options.limit).limit(options.limit).lean(),
    UploadJobModel.countDocuments(filter),
  ]);
  return { documents, total };
}

// Loads pending applications in submission order for the admin review queue.
export function listDealerApplications(options: ListAdminDealerApplicationsQuery) {
  // Pending: oldest submission first (a corrected resubmission joins the back of the queue).
  return DealerModel.find({ status: options.status }).sort(options.status === 'pending' ? { submittedAt: 1, createdAt: 1 } : { updatedAt: -1 }).lean();
}

// Backward-compatible pending queue helper for repository callers and tests.
export function listPendingDealerApplications() {
  return listDealerApplications({ status: 'pending' });
}

// Loads one application, optionally inside the review transaction.
export function findDealerApplicationById(dealerId: string, session?: ClientSession) {
  return DealerModel.findById(dealerId).session(session ?? null);
}

// Applies a review decision only while the application remains pending.
export function updateDealerApplicationReview(dealerId: string, status: 'approved' | 'rejected', adminId: Types.ObjectId, rejectionReason: string | undefined, session: ClientSession) {
  return DealerModel.findOneAndUpdate({ _id: dealerId, status: 'pending' }, {
    $set: { status, reviewedBy: adminId, reviewedAt: new Date(), ...(rejectionReason ? { rejectionReason } : {}) },
    ...(status === 'approved' ? { $unset: { rejectionReason: 1 } } : {}),
  }, { new: true, runValidators: true, session });
}

// Grants dealer access in the same transaction as application approval.
export function promoteApplicantToDealer(userId: Types.ObjectId, session: ClientSession) {
  return AuthUserModel.findByIdAndUpdate(userId, { $set: { role: 'dealer' } }, { new: true, session });
}
