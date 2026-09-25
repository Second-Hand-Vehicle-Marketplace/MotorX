import sharp from 'sharp';
import { LISTING_IMAGE_MAX_DIMENSION_PX, LISTING_IMAGE_MAX_INPUT_PIXELS, LISTING_IMAGE_OUTPUT_QUALITY } from '@motorx/shared-contracts';

const decodableFormats = new Set(['jpeg', 'png', 'webp']);

// Rebuilds a listing photo as a fresh WebP from its decoded pixels (same rules as the backend's
// direct uploads): drops hidden trailing data and all metadata such as EXIF GPS location, keeps
// the photo upright, caps its size, and refuses images above the pixel limit before decoding.
// Returns null for anything that is not a decodable JPEG, PNG, or WebP so callers can skip it.
export async function reencodeListingPhoto(input: Buffer): Promise<Buffer | null> {
  try {
    const image = sharp(input, { limitInputPixels: LISTING_IMAGE_MAX_INPUT_PIXELS, failOn: 'error', animated: false });
    const { format } = await image.metadata();
    if (!format || !decodableFormats.has(format)) return null;
    return await image
      .rotate()
      .resize({ width: LISTING_IMAGE_MAX_DIMENSION_PX, height: LISTING_IMAGE_MAX_DIMENSION_PX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: LISTING_IMAGE_OUTPUT_QUALITY })
      .toBuffer();
  } catch {
    return null;
  }
}
