import type { Response } from 'express';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { readDealerDocument } from '../dealers/dealerDocument.storage.js';
import { changeUserStatusAsAdmin, getAuditLogsForAdmin, getDashboardStatsForAdmin, getDealerDocumentForAdmin, getListingsForAdmin, getPendingApplicationsForAdmin, getSystemHealthForAdmin, getUploadsForAdmin, getUsersForAdmin, removeListingAsAdmin, reviewDealerApplicationAsAdmin } from './admin.service.js';
import type { ListAdminAuditQuery, ListAdminListingsQuery, ListAdminUploadsQuery, ListAdminUsersQuery } from './admin.validation.js';

// Sends the filtered user-management collection.
export async function getAdminUsers(request: AuthenticatedRequest, response: Response) { const result = await getUsersForAdmin(request.query as unknown as ListAdminUsersQuery); sendSuccess(response, result.data, { meta: result.meta }); }

// Applies an administrator-requested account status change.
export async function patchAdminUser(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await changeUserStatusAsAdmin(String(request.params.userId), request.body.status, request.localUser!._id)); }

// Sends the filtered cross-dealership listing collection.
export async function getAdminListings(request: AuthenticatedRequest, response: Response) { const result = await getListingsForAdmin(request.query as unknown as ListAdminListingsQuery); sendSuccess(response, result.data, { meta: result.meta }); }

// Archives one listing through the admin service.
export async function removeAdminListing(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await removeListingAsAdmin(String(request.params.listingId), request.localUser!._id)); }

// Sends aggregate platform statistics.
export async function getAdminDashboardStats(_request: AuthenticatedRequest, response: Response) { sendSuccess(response, await getDashboardStatsForAdmin()); }

// Sends filtered persistent administrative events.
export async function getAdminAuditLogs(request: AuthenticatedRequest, response: Response) { const result = await getAuditLogsForAdmin(request.query as unknown as ListAdminAuditQuery); sendSuccess(response, result.data, { meta: result.meta }); }

// Sends platform-wide upload processing activity.
export async function getAdminUploads(request: AuthenticatedRequest, response: Response) { const result = await getUploadsForAdmin(request.query as unknown as ListAdminUploadsQuery); sendSuccess(response, result.data, { meta: result.meta }); }

// Sends the current operational status snapshot.
export async function getAdminSystemHealth(_request: AuthenticatedRequest, response: Response) { sendSuccess(response, getSystemHealthForAdmin()); }

// Sends the pending dealer review queue.
export async function getAdminDealerApplications(_request: AuthenticatedRequest, response: Response) { sendSuccess(response, await getPendingApplicationsForAdmin()); }

// Streams one protected dealer verification document.
export async function getAdminDealerDocument(request: AuthenticatedRequest, response: Response) { const document = await getDealerDocumentForAdmin(String(request.params.dealerId), Number(request.params.documentIndex)); const stored = await readDealerDocument(document.key); response.setHeader('Content-Type', stored.contentType); response.setHeader('Content-Disposition', `inline; filename="${document.originalName.replace(/["\r\n]/g, '_')}"`); response.send(stored.bytes); }

// Approves one pending dealer application.
export async function approveAdminDealerApplication(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await reviewDealerApplicationAsAdmin(String(request.params.dealerId), request.localUser!._id, 'approved')); }

// Rejects one pending dealer application with a reason.
export async function rejectAdminDealerApplication(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await reviewDealerApplicationAsAdmin(String(request.params.dealerId), request.localUser!._id, 'rejected', request.body.reason)); }
