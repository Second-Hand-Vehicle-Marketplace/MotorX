import mongoose, { type Types } from 'mongoose';
import type { DealerApplicationDto } from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import type { Dealer } from '../dealers/dealer.model.js';
import { notifyAccountSuspended, notifyDealerApplicationDecision, notifyListingRemoved } from '../notifications/notification.service.js';
import { archiveListingByAdmin, createAdminAuditLog, findDealerApplicationById, getAdminStats, listAdminAuditLogs, listAdminListings, listAdminUploads, listAdminUsers, listPendingDealerApplications, promoteApplicantToDealer, updateAdminUserStatus, updateDealerApplicationReview } from './admin.repository.js';
import type { ListAdminAuditQuery, ListAdminListingsQuery, ListAdminUploadsQuery, ListAdminUsersQuery } from './admin.validation.js';

// Converts user persistence fields into the admin API representation.
function serializeUser(user: Record<string, any>) { return { id: String(user._id), email: user.email, displayName: user.displayName ?? '', role: user.role, status: user.status, phone: user.phone, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt }; }

// Converts populated listing fields into the admin API representation.
function serializeListing(record: Record<string, any>) {
  const dealer = record.dealerId && typeof record.dealerId === 'object' ? record.dealerId : null;
  return { id: String(record._id), dealerId: dealer ? String(dealer._id) : String(record.dealerId), dealerName: dealer?.displayName || dealer?.email || 'Unknown dealer', title: record.title, make: record.make, model: record.model, year: record.year, category: record.category, registrationNumber: record.registrationNumber, price: record.price, currency: record.currency, status: record.status, createdAt: record.createdAt };
}

// Converts dealer persistence fields into the shared administration contract.
function serializeDealer(dealer: Dealer & { _id: Types.ObjectId }): DealerApplicationDto {
  return { id: dealer._id.toString(), userId: dealer.userId.toString(), businessName: dealer.businessName, registrationNumber: dealer.registrationNumber, phone: dealer.phone, address: dealer.address, representativeName: dealer.representativeName, city: dealer.city, province: dealer.province, businessPhone: dealer.businessPhone, businessEmail: dealer.businessEmail, website: dealer.website ?? null, dealershipType: dealer.dealershipType, brands: dealer.brands, description: dealer.description, inventoryCount: dealer.inventoryCount ?? null, verificationDocuments: dealer.verificationDocuments, status: dealer.status, rejectionReason: dealer.rejectionReason ?? null, reviewedBy: dealer.reviewedBy?.toString() ?? null, reviewedAt: dealer.reviewedAt?.toISOString() ?? null, createdAt: dealer.createdAt.toISOString(), updatedAt: dealer.updatedAt.toISOString() };
}

// Returns a paginated administrative view of user accounts.
export async function getUsersForAdmin(query: ListAdminUsersQuery) { const result = await listAdminUsers(query); return { data: result.documents.map((item) => serializeUser(item as Record<string, any>)), meta: buildPaginationMeta(query.page, query.limit, result.total) }; }

// Changes account access and records the significant operation.
export async function changeUserStatusAsAdmin(userId: string, status: 'active' | 'suspended', adminId: Types.ObjectId) {
  if (adminId.toString() === userId && status === 'suspended') throw new AppError(409, errorCodes.conflict, 'You cannot suspend your own administrator account.');
  const user = await updateAdminUserStatus(userId, status);
  if (!user) throw new AppError(404, errorCodes.notFound, 'The user was not found.');
  const record = user as unknown as { _id: Types.ObjectId; displayName?: string; email: string };
  await createAdminAuditLog({ eventType: status === 'suspended' ? 'user_suspended' : 'user_activated', actorId: adminId, targetId: record._id, targetName: record.displayName || record.email, details: `User account ${status}.` });
  if (status === 'suspended') await notifyAccountSuspended(record._id);
  return serializeUser(user as unknown as Record<string, any>);
}

// Returns a paginated cross-dealership listing view.
export async function getListingsForAdmin(query: ListAdminListingsQuery) { const result = await listAdminListings(query); return { data: result.documents.map((item) => serializeListing(item as Record<string, any>)), meta: buildPaginationMeta(query.page, query.limit, result.total) }; }

// Archives a listing and records which administrator removed it.
export async function removeListingAsAdmin(listingId: string, adminId: Types.ObjectId) {
  const listing = await archiveListingByAdmin(listingId);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  const record = listing as unknown as { _id: Types.ObjectId; title: string; make: string; model: string; year: number; category: string; registrationNumber: string; dealerId: Types.ObjectId | { _id: Types.ObjectId }; createdAt: Date };
  const dealerUserId = typeof record.dealerId === 'object' && '_id' in record.dealerId ? record.dealerId._id : record.dealerId;
  await createAdminAuditLog({ eventType: 'listing_removed', actorId: adminId, targetId: record._id, targetName: record.title, details: 'Vehicle listing archived by an administrator.' });
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

// Reports truthful live state for configured backend dependencies.
export function getSystemHealthForAdmin() { const ready = mongoose.connection.readyState === 1; return { checkedAt: new Date().toISOString(), backend: { status: 'operational', uptimeSeconds: Math.floor(process.uptime()) }, database: { status: ready ? 'operational' : 'unavailable', readyState: mongoose.connection.readyState }, queue: { status: 'not_configured' }, worker: { status: 'not_configured' } }; }

// Returns the pending applications visible to administrators.
export async function getPendingApplicationsForAdmin() { const records = await listPendingDealerApplications(); return records.map((item) => serializeDealer(item as unknown as Dealer & { _id: Types.ObjectId })); }

// Returns protected document metadata after validating its application and index.
export async function getDealerDocumentForAdmin(dealerId: string, index: number) { const dealer = await findDealerApplicationById(dealerId); if (!dealer) throw new AppError(404, errorCodes.notFound, 'The dealer application was not found.'); const document = dealer.verificationDocuments[index]; if (!document) throw new AppError(404, errorCodes.notFound, 'The verification document was not found.'); return document; }

// Reviews an application, role assignment, and audit record as one transaction.
export async function reviewDealerApplicationAsAdmin(dealerId: string, adminId: Types.ObjectId, decision: 'approved' | 'rejected', reason?: string) {
  const session = await mongoose.startSession(); let result: DealerApplicationDto | undefined;
  try { await session.withTransaction(async () => {
    const existing = await findDealerApplicationById(dealerId, session);
    if (!existing) throw new AppError(404, errorCodes.notFound, 'The dealer application was not found.');
    if (existing.status !== 'pending') throw new AppError(409, errorCodes.conflict, 'This dealer application has already been reviewed.');
    const updated = await updateDealerApplicationReview(dealerId, decision, adminId, reason, session);
    if (!updated) throw new AppError(409, errorCodes.conflict, 'This dealer application has already been reviewed.');
    if (decision === 'approved' && !(await promoteApplicantToDealer(updated.userId, session))) throw new AppError(404, errorCodes.notFound, 'The applicant user account was not found.');
    await createAdminAuditLog({ eventType: decision === 'approved' ? 'dealer_approved' : 'dealer_rejected', actorId: adminId, targetId: updated.userId, targetName: updated.businessName, details: decision === 'approved' ? 'Dealer application approved.' : `Dealer application rejected: ${reason}` }, session);
    result = serializeDealer(updated.toObject() as Dealer & { _id: Types.ObjectId });
  }); } finally { await session.endSession(); }
  if (!result) throw new AppError(500, errorCodes.internal, 'The dealer review could not be completed.');
  // Sent after the transaction commits — a delivery hiccup must never roll back the review itself.
  await notifyDealerApplicationDecision(new mongoose.Types.ObjectId(result.userId), decision, reason);
  return result;
}
