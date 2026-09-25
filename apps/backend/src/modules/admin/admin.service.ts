import mongoose, { type Types } from 'mongoose';
import { serializeReviewState } from '../dealers/dealer.service.js';
import { invalidateHiddenDealerIds } from '../marketplace/publicVisibility.js';
import type { DealerApplicationDto } from '@motorx/shared-contracts';
import { firebaseAuth } from '../../config/firebase.js';
import { inventoryQueue } from '../../config/queue.js';
import { AuthUserModel } from '../auth-users/authUser.model.js';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import type { Dealer } from '../dealers/dealer.model.js';
import { notifyAccountSuspended, notifyDealerApplicationDecision, notifyListingRemoved } from '../notifications/notification.service.js';
import { archiveListingByAdmin, createAdminAuditLog, findDealerApplicationById, getAdminStats, listAdminAuditLogs, listAdminListings, listAdminUploads, listAdminUsers, listDealerApplications, promoteApplicantToDealer, updateAdminUserStatus, updateDealerApplicationReview } from './admin.repository.js';
import type { ListAdminAuditQuery, ListAdminDealerApplicationsQuery, ListAdminListingsQuery, ListAdminUploadsQuery, ListAdminUsersQuery } from './admin.validation.js';

// Converts user persistence fields into the admin API representation.
function serializeUser(user: Record<string, any>) { return { id: String(user._id), email: user.email, displayName: user.displayName ?? '', role: user.role, status: user.status, phone: user.phone, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt }; }

// Converts populated listing fields into the admin API representation.
function serializeListing(record: Record<string, any>) {
  const dealer = record.dealerId && typeof record.dealerId === 'object' ? record.dealerId : null;
  return { id: String(record._id), dealerId: dealer ? String(dealer._id) : String(record.dealerId), dealerName: dealer?.displayName || dealer?.email || 'Unknown dealer', title: record.title, make: record.make, model: record.model, year: record.year, category: record.category, registrationNumber: record.registrationNumber, price: record.price, currency: record.currency, status: record.status, createdAt: record.createdAt };
}

// Converts dealer persistence fields into the shared administration contract.
function serializeDealer(dealer: Dealer & { _id: Types.ObjectId }): DealerApplicationDto {
  return {
    id: dealer._id.toString(), userId: dealer.userId.toString(), businessName: dealer.businessName,
    registrationNumber: dealer.registrationNumber, phone: dealer.phone, address: dealer.address,
    representativeName: dealer.representativeName ?? 'Not provided', city: dealer.city ?? 'Not provided',
    province: dealer.province ?? 'Not provided', businessPhone: dealer.businessPhone ?? dealer.phone,
    businessEmail: dealer.businessEmail ?? 'Not provided', website: dealer.website ?? null,
    dealershipType: dealer.dealershipType ?? 'used', brands: dealer.brands ?? [],
    description: dealer.description ?? 'No business description was provided.', inventoryCount: dealer.inventoryCount ?? null,
    verificationDocuments: dealer.verificationDocuments ?? [], status: dealer.status,
    rejectionReason: dealer.rejectionReason ?? null, reviewedBy: dealer.reviewedBy?.toString() ?? null,
    reviewedAt: dealer.reviewedAt?.toISOString() ?? null, documentsDeletedAt: dealer.documentsDeletedAt?.toISOString() ?? null, ...serializeReviewState(dealer), createdAt: dealer.createdAt.toISOString(), updatedAt: dealer.updatedAt.toISOString(),
  };
}

// Runs fn in one MongoDB transaction (retried by the driver on transient errors) and returns its result.
async function inTransaction<T>(fn: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => { result = await fn(session); });
    return result;
  } finally { await session.endSession(); }
}

// Returns a paginated administrative view of user accounts.
export async function getUsersForAdmin(query: ListAdminUsersQuery) { const result = await listAdminUsers(query); return { data: result.documents.map((item) => serializeUser(item as Record<string, any>)), meta: buildPaginationMeta(query.page, query.limit, result.total) }; }

// Changes account access and records the significant operation.
export async function changeUserStatusAsAdmin(userId: string, status: 'active' | 'suspended', adminId: Types.ObjectId) {
  if (adminId.toString() === userId && status === 'suspended') throw new AppError(409, errorCodes.conflict, 'You cannot suspend your own administrator account.');
  // The status change and its audit record commit together, or not at all.
  const user = await inTransaction(async (session) => {
    const updated = await updateAdminUserStatus(userId, status, session);
    if (!updated) throw new AppError(404, errorCodes.notFound, 'The user was not found.');
    const target = updated as unknown as { _id: Types.ObjectId; displayName?: string; email: string };
    await createAdminAuditLog({ eventType: status === 'suspended' ? 'user_suspended' : 'user_activated', actorId: adminId, targetId: target._id, targetName: target.displayName || target.email, details: `User account ${status}.` }, session);
    return updated;
  });
  const record = user as unknown as { _id: Types.ObjectId; displayName?: string; email: string };
  invalidateHiddenDealerIds(); // a suspended dealer's listings disappear from public pages at once
  if (status === 'suspended') await notifyAccountSuspended(record._id);
  return serializeUser(user as unknown as Record<string, any>);
}

// Returns a paginated cross-dealership listing view.
export async function getListingsForAdmin(query: ListAdminListingsQuery) { const result = await listAdminListings(query); return { data: result.documents.map((item) => serializeListing(item as Record<string, any>)), meta: buildPaginationMeta(query.page, query.limit, result.total) }; }

// Archives a listing and records which administrator removed it.
export async function removeListingAsAdmin(listingId: string, adminId: Types.ObjectId) {
  // The archive and its audit record commit together, or not at all.
  const listing = await inTransaction(async (session) => {
    const archived = await archiveListingByAdmin(listingId, session);
    if (!archived) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
    const target = archived as unknown as { _id: Types.ObjectId; title: string };
    await createAdminAuditLog({ eventType: 'listing_removed', actorId: adminId, targetId: target._id, targetName: target.title, details: 'Vehicle listing archived by an administrator.' }, session);
    return archived;
  });
  const record = listing as unknown as { _id: Types.ObjectId; title: string; make: string; model: string; year: number; category: string; registrationNumber: string; dealerId: Types.ObjectId | { _id: Types.ObjectId }; createdAt: Date };
  const dealerUserId = typeof record.dealerId === 'object' && '_id' in record.dealerId ? record.dealerId._id : record.dealerId;
  await notifyListingRemoved(dealerUserId, record.title, {
    vehicle: `${record.year} ${record.make} ${record.model}`,
    registrationNumber: record.registrationNumber,
    listingId: record._id.toString(),
    category: record.category,
    uploadedAt: record.createdAt.toISOString(),
    removedAt: new Date().toISOString(),
  });
  return serializeListing(listing as unknown as Record<string, any>);
}

// Returns database-backed dashboard totals.
export function getDashboardStatsForAdmin() { return getAdminStats(); }

// Returns paginated audit history with populated administrator names.
export async function getAuditLogsForAdmin(query: ListAdminAuditQuery) {
  const result = await listAdminAuditLogs(query);
  const data = result.documents.map((record: Record<string, any>) => ({ id: String(record._id), eventType: record.eventType, actorId: String(record.actorId?._id ?? record.actorId), actorName: record.actorId?.displayName || record.actorId?.email || 'Unknown administrator', targetId: String(record.targetId), targetName: record.targetName, details: record.details, timestamp: record.createdAt }));
  return { data, meta: buildPaginationMeta(query.page, query.limit, result.total) };
}

// Returns paginated platform-wide inventory upload activity.
export async function getUploadsForAdmin(query: ListAdminUploadsQuery) {
  const result = await listAdminUploads(query);
  const data = result.documents.map((record: Record<string, any>) => ({ id: String(record._id), dealerId: String(record.dealerId?._id ?? record.dealerId), dealerName: record.dealerId?.displayName || record.dealerId?.email || 'Unknown dealer', fileName: record.fileName, fileSize: record.fileSize, status: record.status, totalRecords: record.totalRecords, processedRecords: record.processedRecords, validRecords: record.validRecords, rejectedRecords: record.rejectedRecords, failureReason: record.failureReason ?? null, createdAt: record.createdAt, completedAt: record.completedAt ?? null }));
  return { data, meta: buildPaginationMeta(query.page, query.limit, result.total) };
}

// Worker liveness can't be observed directly from the backend process (separate container, no
// shared port), so it's approximated via a heartbeat the worker writes on its reaper interval
// (default 60s — see apps/worker/src/jobs/reaper.job.ts). This window must stay comfortably
// above that interval so a healthy worker between heartbeats isn't reported as down.
const WORKER_HEARTBEAT_STALE_AFTER_MS = 120_000;

// Reports truthful live state for configured backend dependencies.
export async function getSystemHealthForAdmin() {
  const ready = mongoose.connection.readyState === 1;

  let queueStatus: { status: string; counts?: Record<string, number> };
  try {
    queueStatus = { status: 'operational', counts: await inventoryQueue.getJobCounts('active', 'waiting', 'delayed', 'failed') };
  } catch {
    queueStatus = { status: 'unavailable' };
  }

  const heartbeat = await mongoose.connection.db
    ?.collection<{ _id: string; lastSeenAt: Date }>('workerHeartbeats')
    .findOne({ _id: 'worker' });
  const lastSeenAt = heartbeat?.lastSeenAt;
  const workerAlive = !!lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < WORKER_HEARTBEAT_STALE_AFTER_MS;

  return {
    checkedAt: new Date().toISOString(),
    backend: { status: 'operational', uptimeSeconds: Math.floor(process.uptime()) },
    database: { status: ready ? 'operational' : 'unavailable', readyState: mongoose.connection.readyState },
    queue: queueStatus,
    worker: { status: workerAlive ? 'operational' : 'unavailable', lastSeenAt: lastSeenAt?.toISOString() ?? null },
  };
}

// Returns the pending applications visible to administrators.
export async function getDealerApplicationsForAdmin(query: ListAdminDealerApplicationsQuery) { const records = await listDealerApplications(query); return records.map((item) => serializeDealer(item as unknown as Dealer & { _id: Types.ObjectId })); }

// Returns protected document metadata after validating its application and index, and records
// who opened which identity document in the audit log before any bytes are released.
export async function getDealerDocumentForAdmin(dealerId: string, index: number, adminId: Types.ObjectId) {
  const dealer = await findDealerApplicationById(dealerId);
  if (!dealer) throw new AppError(404, errorCodes.notFound, 'The dealer application was not found.');
  if (dealer.documentsDeletedAt) throw new AppError(410, errorCodes.notFound, `Verification documents were deleted on ${dealer.documentsDeletedAt.toISOString().slice(0, 10)} under the document retention policy.`);
  const document = dealer.verificationDocuments[index];
  if (!document) throw new AppError(404, errorCodes.notFound, 'The verification document was not found.');
  await createAdminAuditLog({ eventType: 'dealer_document_viewed', actorId: adminId, targetId: dealer.userId, targetName: dealer.businessName, details: `Viewed ${document.category} document "${document.originalName}".`.slice(0, 500) });
  return document;
}

// A dealer can publish to every buyer, so their email must be proven before approval. Checked with
// Firebase at approval time (not from a token), so it reflects the applicant's current state.
async function assertApplicantEmailVerified(dealerId: string) {
  const application = await findDealerApplicationById(dealerId);
  if (!application) return; // the transaction below reports the missing application
  const applicant = await AuthUserModel.findById(application.userId).select('firebaseUid').lean<{ firebaseUid: string }>();
  if (!applicant) return;
  const { emailVerified } = await firebaseAuth.getUser(applicant.firebaseUid);
  if (!emailVerified) throw new AppError(409, errorCodes.conflict, 'The applicant has not verified their email address yet. Ask them to open the verification link, then approve again.');
}

// Reviews an application, role assignment, and audit record as one transaction.
export async function reviewDealerApplicationAsAdmin(dealerId: string, adminId: Types.ObjectId, decision: 'approved' | 'rejected', reason?: string) {
  if (decision === 'approved') await assertApplicantEmailVerified(dealerId);
  const session = await mongoose.startSession(); let result: DealerApplicationDto | undefined;
  try {
    await session.withTransaction(async () => {
      const existing = await findDealerApplicationById(dealerId, session);
      if (!existing) throw new AppError(404, errorCodes.notFound, 'The dealer application was not found.');
      if (existing.status !== 'pending') throw new AppError(409, errorCodes.conflict, 'This dealer application has already been reviewed.');
      const updated = await updateDealerApplicationReview(dealerId, decision, adminId, reason, session);
      if (!updated) throw new AppError(409, errorCodes.conflict, 'This dealer application has already been reviewed.');
      if (decision === 'approved' && !(await promoteApplicantToDealer(updated.userId, session))) throw new AppError(404, errorCodes.notFound, 'The applicant user account was not found.');
      await createAdminAuditLog({ eventType: decision === 'approved' ? 'dealer_approved' : 'dealer_rejected', actorId: adminId, targetId: updated.userId, targetName: updated.businessName, details: decision === 'approved' ? 'Dealer application approved.' : `Dealer application rejected: ${reason}` }, session);
      result = serializeDealer(updated.toObject() as Dealer & { _id: Types.ObjectId });
    });
  } finally { await session.endSession(); }
  if (!result) throw new AppError(500, errorCodes.internal, 'The dealer review could not be completed.');
  // Sent after the transaction commits — a delivery hiccup must never roll back the review itself.
  await notifyDealerApplicationDecision(new mongoose.Types.ObjectId(result.userId), decision, reason);
  return result;
}
