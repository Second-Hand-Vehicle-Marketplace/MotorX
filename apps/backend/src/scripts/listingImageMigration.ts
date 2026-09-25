import sharp from 'sharp';
import { LISTING_IMAGE_MAX_DIMENSION_PX, LISTING_IMAGE_OBJECT_PREFIX, LISTING_IMAGE_OUTPUT_QUALITY } from '@motorx/shared-contracts';
import { InvalidImageError, reencodeImage } from '../shared/utils/imageReencode.js';

// Storage and database operations the migration needs; injected so the logic is testable.
export interface MigrationDeps {
  listings(): AsyncIterable<{ id: string; images: Array<{ key: string; url: string }> }>;
  exists(objectKey: string): Promise<boolean>;
  read(objectKey: string): Promise<Buffer | null>; // null when the object does not exist
  write(objectKey: string, body: Buffer, contentType: string): Promise<void>;
  remove(objectKey: string): Promise<void>;
  setImageUrls(listingId: string, urls: Record<string, string>): Promise<void>;
  log(message: string): void;
}

export interface MigrationOptions { dryRun: boolean; keepLegacy: boolean; publicUrl?: string }
export interface MigrationSummary { migrated: number; alreadyMigrated: number; missing: number; failed: number; urlsRewritten: number }

// True when the stored bytes are already a metadata-free WebP (photos uploaded after
// re-encoding was introduced), so they can be moved without another lossy re-encode.
async function isCleanWebp(bytes: Buffer) {
  try { const metadata = await sharp(bytes).metadata(); return metadata.format === 'webp' && !metadata.exif && !metadata.xmp && !metadata.iptc; }
  catch { return false; }
}

// Moves every listing photo still stored at the bucket root to the listing-images/ prefix,
// re-encoding it on the way (strips EXIF/GPS, hidden data; caps size). Idempotent: photos already
// under the prefix are skipped, so the script can be stopped and run again at any time.
// With publicUrl, also points each stored image URL at that base (e.g. the CDN).
export async function migrateListingImages(deps: MigrationDeps, options: MigrationOptions): Promise<MigrationSummary> {
  const summary: MigrationSummary = { migrated: 0, alreadyMigrated: 0, missing: 0, failed: 0, urlsRewritten: 0 };
  for await (const listing of deps.listings()) {
    const newUrls: Record<string, string> = {};
    for (const image of listing.images) {
      const target = `${LISTING_IMAGE_OBJECT_PREFIX}${image.key}`;
      if (options.publicUrl) {
        const url = `${options.publicUrl.replace(/\/$/, '')}/${encodeURIComponent(image.key)}`;
        if (image.url !== url) newUrls[image.key] = url;
      }
      if (await deps.exists(target)) { summary.alreadyMigrated += 1; continue; }

      const original = await deps.read(image.key);
      if (!original) { summary.missing += 1; deps.log(`Missing object for listing ${listing.id}: ${image.key}`); continue; }
      let body: Buffer;
      try {
        body = await isCleanWebp(original) ? original : await reencodeImage(original, { maxDimension: LISTING_IMAGE_MAX_DIMENSION_PX, output: 'webp', quality: LISTING_IMAGE_OUTPUT_QUALITY });
      } catch (error) {
        summary.failed += 1;
        deps.log(`Could not re-encode ${image.key} (listing ${listing.id}): ${error instanceof InvalidImageError ? error.message : String(error)}. Left in place.`);
        continue;
      }
      if (!options.dryRun) {
        await deps.write(target, body, 'image/webp');
        if (!options.keepLegacy) await deps.remove(image.key);
      }
      summary.migrated += 1;
    }
    if (Object.keys(newUrls).length) {
      if (!options.dryRun) await deps.setImageUrls(listing.id, newUrls);
      summary.urlsRewritten += Object.keys(newUrls).length;
    }
  }
  return summary;
}
