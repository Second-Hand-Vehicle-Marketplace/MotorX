import sharp from 'sharp';
import { LISTING_IMAGE_MAX_INPUT_PIXELS } from '@motorx/shared-contracts';

const decodableFormats = new Set(['jpeg', 'png', 'webp']);

export type ReencodeOutput = 'webp' | 'jpeg' | 'png';

export class InvalidImageError extends Error {}

// Fully decodes an image and saves a new file from its pixels only. Hidden trailing data,
// malformed structures, and all metadata (EXIF GPS, camera details) are dropped; the EXIF
// orientation is applied first so photos stay upright. Images above the pixel cap are refused
// before decoding, so a small file cannot expand into gigabytes of memory.
export async function reencodeImage(input: Buffer, options: { maxDimension: number; output: ReencodeOutput; quality: number }): Promise<Buffer> {
  try {
    const image = sharp(input, { limitInputPixels: LISTING_IMAGE_MAX_INPUT_PIXELS, failOn: 'error', animated: false });
    const { format } = await image.metadata();
    if (!format || !decodableFormats.has(format)) throw new InvalidImageError(`Unsupported image format: ${format ?? 'unknown'}.`);

    const resized = image
      .rotate()
      .resize({ width: options.maxDimension, height: options.maxDimension, fit: 'inside', withoutEnlargement: true });
    if (options.output === 'webp') return await resized.webp({ quality: options.quality }).toBuffer();
    if (options.output === 'jpeg') return await resized.jpeg({ quality: options.quality, mozjpeg: true }).toBuffer();
    return await resized.png({ compressionLevel: 9 }).toBuffer();
  } catch (error) {
    if (error instanceof InvalidImageError) throw error;
    throw new InvalidImageError(error instanceof Error ? error.message : 'The image could not be decoded.');
  }
}
