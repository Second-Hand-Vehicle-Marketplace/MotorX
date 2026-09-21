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

// Streams a private MinIO object through a public, read-only API endpoint.
export async function getListingImageFile(request: Request, response: Response): Promise<void> {
  let object;
  try { object = await getListingImageObject(String(request.params.imageKey)); }
  catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'NoSuchKey')
      throw new AppError(404, errorCodes.notFound, 'The listing image was not found.');
    throw error;
  }
  response.setHeader('Content-Type', object.contentType);
  response.setHeader('Cache-Control', object.cacheControl);
  response.send(object.bytes);
}
