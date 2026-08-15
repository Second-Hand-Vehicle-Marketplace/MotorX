import type { Response } from 'express';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { createInventoryUpload, getDealerUpload, getDealerUploads } from './inventory.service.js';
import type { ListInventoryUploadsQuery } from './inventory.validation.js';

// Accepts one CSV and immediately returns its queued upload job.
export async function uploadDealerInventory(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await createInventoryUpload(request.localUser!._id, request.file!), { status: 201 }); }

// Sends the authenticated dealer's upload history without response metadata.
export async function listMyInventoryUploads(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await getDealerUploads(request.localUser!._id, request.query as unknown as ListInventoryUploadsQuery)); }

// Sends one authenticated dealer-owned upload job.
export async function getMyInventoryUpload(request: AuthenticatedRequest, response: Response) { sendSuccess(response, await getDealerUpload(request.localUser!._id, String(request.params.uploadId))); }
