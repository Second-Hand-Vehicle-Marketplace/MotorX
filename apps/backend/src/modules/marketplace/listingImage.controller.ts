import { pipeline } from 'node:stream/promises';
import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import type { AuthenticatedRequest } from '../../shared/types/authenticatedRequest.js';
import { addDealerListingImage, deleteDealerListingImage, reorderDealerListingImages } from './listingImage.service.js';
import { getListingImageObject } from './listingImage.storage.js';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';

// Uploads one image to an authenticated dealer's listing.
export async function addListingImage(request: AuthenticatedRequest, response: Response): Promise<void> {
  const listing = await addDealerListingImage(String(request.params.listingId), request.localUser!._id, request.file!, request.body.alt);
  sendSuccess(response, listing, { status: 201 });
}

// Deletes one owned listing image from MongoDB and object storage.
export async function deleteListingImage(request: AuthenticatedRequest, response: Response): Promise<void> {
  sendSuccess(response, await deleteDealerListingImage(String(request.params.listingId), request.localUser!._id, String(request.params.imageKey)));
}

// Saves a complete reordered list of image keys for an owned listing.
export async function reorderListingImages(request: AuthenticatedRequest, response: Response): Promise<void> {
  sendSuccess(response, await reorderDealerListingImages(String(request.params.listingId), request.localUser!._id, request.body.imageKeys));
}

// Serves a listing photo from private storage through a public, read-only endpoint. Used locally
// and as the fallback when no CDN is configured. The file is streamed straight from storage (not
// held in memory), and a browser that already has it gets 304 Not Modified with no body.
export async function getListingImageFile(request: Request, response: Response): Promise<void> {
  let object;
  try { object = await getListingImageObject(String(request.params.imageKey), request.header('if-none-match') ?? undefined); }
  catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'name' in error && (error.name === 'NoSuchKey' || error.name === 'NotFound'))
      throw new AppError(404, errorCodes.notFound, 'The listing image was not found.');
    throw error;
  }
  if (object.notModified) { response.status(304).end(); return; }
  response.setHeader('Content-Type', object.contentType);
  response.setHeader('Cache-Control', object.cacheControl);
  if (object.etag) response.setHeader('ETag', object.etag);
  if (object.contentLength !== undefined) response.setHeader('Content-Length', String(object.contentLength));
  await pipeline(object.body, response);
}
