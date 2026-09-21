import type { Response } from 'express';
import type { VehicleCategory } from '@motorx/shared-contracts';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { attachInventoryImagesZip, createInventoryUpload, getDealerUpload, getDealerUploadRejectedRecords, getDealerUploads, getInventoryCsvTemplate } from './inventory.service.js';
import type { ListInventoryUploadsQuery, ListRejectedRecordsQuery } from './inventory.validation.js';

// Accepts one CSV (for the dealer-selected category) and immediately returns its queued upload job.
export async function uploadDealerInventory(request: AuthenticatedRequest, response: Response) {
  const category = (request.body as { category: VehicleCategory }).category;
  sendSuccess(response, await createInventoryUpload(request.localUser!._id, category, request.file!), { status: 201 });
}

// Accepts one vehicle-photos zip for an already-processed upload job.
export async function uploadDealerInventoryImages(request: AuthenticatedRequest, response: Response) {
  sendSuccess(response, await attachInventoryImagesZip(request.localUser!._id, String(request.params.uploadId), request.file!), { status: 202 });
}

// Streams a downloadable CSV template (headers + example rows) for the requested category.
export async function downloadInventoryCsvTemplate(request: AuthenticatedRequest, response: Response) {
  const { fileName, content } = getInventoryCsvTemplate(request.params.category as VehicleCategory);
  response.status(200).set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${fileName}"` }).send(content);
}

// Sends the authenticated dealer's upload history without response metadata.
export async function listMyInventoryUploads(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await getDealerUploads(request.localUser!._id, request.query as unknown as ListInventoryUploadsQuery)); }

// Sends one authenticated dealer-owned upload job.
export async function getMyInventoryUpload(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await getDealerUpload(request.localUser!._id, String(request.params.uploadId))); }

// Sends the rejected rows for one authenticated dealer-owned upload job.
export async function listMyUploadRejectedRecords(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await getDealerUploadRejectedRecords(request.localUser!._id, String(request.params.uploadId), request.query as unknown as ListRejectedRecordsQuery)); }
