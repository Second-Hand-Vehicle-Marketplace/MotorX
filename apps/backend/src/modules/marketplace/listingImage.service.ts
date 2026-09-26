import { randomUUID } from 'node:crypto';
import type { Types } from 'mongoose';
import { storageConfig } from '../../config/storage.js';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import type { ListingImage } from './listing.model.js';
import { addOwnedListingImage, findOwnedListing, removeOwnedListingImage, reorderOwnedListingImages, restoreOwnedListingImage, type ListingRecord } from './listing.repository.js';
import { serializeListing } from './listing.service.js';
import { deleteListingImageObject, uploadListingImage } from './listingImage.storage.js';
import { hasValidImageSignature } from './listingImage.signature.js';
import { LISTING_IMAGE_MAX_DIMENSION_PX, LISTING_IMAGE_OUTPUT_QUALITY, LISTING_IMAGE_THUMB_MAX_DIMENSION_PX, LISTING_IMAGE_THUMB_QUALITY } from '@motorx/shared-contracts';
import { InvalidImageError, reencodeImage } from '../../shared/utils/imageReencode.js';

// Copies one image's stored fields with a new position (keeps the small copy's URL).
function atPosition(image: ListingImage, order: number): ListingImage {
  return { key: image.key, url: image.url, ...(image.thumbUrl ? { thumbUrl: image.thumbUrl } : {}), ...(image.alt ? { alt: image.alt } : {}), order };
}

// Uploads an image and atomically attaches its metadata to an owned listing.
export async function addDealerListingImage(listingId: string, dealerId: Types.ObjectId, file: Express.Multer.File, alt?: string) {
  if (!hasValidImageSignature(file)) throw new AppError(400, errorCodes.validation, 'The uploaded file content is not a valid JPEG, PNG, or WebP image.');
  const listing = await findOwnedListing(listingId, dealerId);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  if (listing.images.length >= storageConfig.maxListingImages)
    throw new AppError(409, errorCodes.conflict, `A listing can contain at most ${storageConfig.maxListingImages} images.`);

  // Every stored photo is a fresh WebP rebuilt from the decoded pixels, never the uploaded bytes.
  // A second, small copy is made from the cleaned photo for cards and phone screens.
  let webp: Buffer;
  let thumb: Buffer;
  try {
    webp = await reencodeImage(file.buffer, { maxDimension: LISTING_IMAGE_MAX_DIMENSION_PX, output: 'webp', quality: LISTING_IMAGE_OUTPUT_QUALITY });
    thumb = await reencodeImage(webp, { maxDimension: LISTING_IMAGE_THUMB_MAX_DIMENSION_PX, output: 'webp', quality: LISTING_IMAGE_THUMB_QUALITY });
  }
  catch (error) {
    if (error instanceof InvalidImageError) throw new AppError(400, errorCodes.validation, 'The image could not be processed. Upload a valid JPEG, PNG, or WebP photo under 40 megapixels.');
    throw error;
  }
  const key = `${listingId}-${randomUUID()}.webp`;
  let url: string;
  let thumbUrl: string;
  try { [url, thumbUrl] = await Promise.all([uploadListingImage(key, webp, 'image/webp'), uploadListingImage(key, thumb, 'image/webp', 'thumb')]); }
  catch (error) { await deleteListingImageObject(key).catch(() => undefined); throw error; }
  const image: ListingImage = { key, url, thumbUrl, ...(alt ? { alt } : {}), order: listing.images.length };
  try {
    const updated = await addOwnedListingImage(listingId, dealerId, image, storageConfig.maxListingImages);
    if (!updated) throw new AppError(409, errorCodes.conflict, `A listing can contain at most ${storageConfig.maxListingImages} images.`);
    return serializeListing(updated.toObject() as ListingRecord);
  } catch (error) {
    await deleteListingImageObject(key).catch(() => undefined);
    throw error;
  }
}

// Deletes image metadata and storage, restoring metadata if storage fails.
export async function deleteDealerListingImage(listingId: string, dealerId: Types.ObjectId, imageKey: string) {
  const listing = await findOwnedListing(listingId, dealerId);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  const image = listing.images.find((item: ListingImage) => item.key === imageKey);
  if (!image) throw new AppError(404, errorCodes.notFound, 'The listing image was not found.');
  const updated = await removeOwnedListingImage(listingId, dealerId, imageKey);
  if (!updated) throw new AppError(409, errorCodes.conflict, 'The listing image changed before deletion completed.');
  try { await deleteListingImageObject(imageKey); }
  catch (error) { await restoreOwnedListingImage(listingId, dealerId, image); throw error; }
  const reordered = updated.images.map((item: ListingImage, order: number) => atPosition(item, order));
  const normalized = await reorderOwnedListingImages(listingId, dealerId, reordered);
  return serializeListing((normalized ?? updated).toObject() as ListingRecord);
}

// Validates a complete key set before saving a new image order.
export async function reorderDealerListingImages(listingId: string, dealerId: Types.ObjectId, imageKeys: string[]) {
  const listing = await findOwnedListing(listingId, dealerId);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  if (new Set(imageKeys).size !== imageKeys.length || imageKeys.length !== listing.images.length)
    throw new AppError(400, errorCodes.validation, 'Image order must contain every image key exactly once.');
  const byKey = new Map<string, ListingImage>(listing.images.map((image: ListingImage) => [image.key, image]));
  if (imageKeys.some((key) => !byKey.has(key))) throw new AppError(400, errorCodes.validation, 'Image order contains an unknown key.');
  const images = imageKeys.map((key, order) => atPosition(byKey.get(key)!, order));
  const updated = await reorderOwnedListingImages(listingId, dealerId, images);
  if (!updated) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  return serializeListing(updated.toObject() as ListingRecord);
}
