import { imageSize } from 'image-size';
import {
  LISTING_IMAGE_ASPECT_RATIO,
  LISTING_IMAGE_ASPECT_RATIO_LABEL,
  LISTING_IMAGE_ASPECT_RATIO_TOLERANCE,
  LISTING_IMAGE_MIN_HEIGHT_PX,
  LISTING_IMAGE_MIN_WIDTH_PX,
} from '@motorx/shared-contracts';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';

// Rejects images too small or too far off the standard listing frame before they reach storage.
// The frontend's crop tool always exports exactly at this ratio; this guards the API directly.
export function assertListingImageDimensions(buffer: Buffer): void {
  const { width, height } = imageSize(buffer);
  if (!width || !height) throw new AppError(400, errorCodes.validation, 'Could not read the image dimensions.');

  if (width < LISTING_IMAGE_MIN_WIDTH_PX || height < LISTING_IMAGE_MIN_HEIGHT_PX)
    throw new AppError(400, errorCodes.validation, `The image must be at least ${LISTING_IMAGE_MIN_WIDTH_PX}×${LISTING_IMAGE_MIN_HEIGHT_PX}px.`);

  const ratio = width / height;
  const deviation = Math.abs(ratio - LISTING_IMAGE_ASPECT_RATIO) / LISTING_IMAGE_ASPECT_RATIO;
  if (deviation > LISTING_IMAGE_ASPECT_RATIO_TOLERANCE)
    throw new AppError(400, errorCodes.validation, `The image must use a ${LISTING_IMAGE_ASPECT_RATIO_LABEL} aspect ratio.`);
}
