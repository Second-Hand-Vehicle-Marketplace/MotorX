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
import { assertListingImageDimensions } from './listingImage.dimensions.js';

const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;

// Uploads an image and atomically attaches its metadata to an owned listing.
export async function addDealerListingImage(listingId: string, dealerId: Types.ObjectId, file: Express.Multer.File, alt?: string) {
  if (!hasValidImageSignature(file)) throw new AppError(400, errorCodes.validation, 'The uploaded file content is not a valid JPEG, PNG, or WebP image.');
  assertListingImageDimensions(file.buffer);
  const listing = await findOwnedListing(listingId, dealerId);
  if (!listing) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  if (listing.images.length >= storageConfig.maxListingImages)
    throw new AppError(409, errorCodes.conflict, `A listing can contain at most ${storageConfig.maxListingImages} images.`);

  const extension = extensions[file.mimetype as keyof typeof extensions];
  const key = `${listingId}-${randomUUID()}.${extension}`;
  const url = await uploadListingImage(key, file);
  const image: ListingImage = { key, url, ...(alt ? { alt } : {}), order: listing.images.length };
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
  const reordered = updated.images.map((item: ListingImage, order: number) => ({ key: item.key, url: item.url, ...(item.alt ? { alt: item.alt } : {}), order }));
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
  const images = imageKeys.map((key, order) => { const image = byKey.get(key)!; return { key: image.key, url: image.url, ...(image.alt ? { alt: image.alt } : {}), order }; });
  const updated = await reorderOwnedListingImages(listingId, dealerId, images);
  if (!updated) throw new AppError(404, errorCodes.notFound, 'The vehicle listing was not found.');
  return serializeListing(updated.toObject() as ListingRecord);
}
