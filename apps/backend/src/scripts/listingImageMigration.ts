import sharp from 'sharp';
import {
  LISTING_IMAGE_MAX_DIMENSION_PX, LISTING_IMAGE_OBJECT_PREFIX, LISTING_IMAGE_OUTPUT_QUALITY,
  LISTING_IMAGE_THUMB_MAX_DIMENSION_PX, LISTING_IMAGE_THUMB_QUALITY, LISTING_IMAGE_THUMB_SUBPATH,
} from '@motorx/shared-contracts';
import { InvalidImageError, reencodeImage } from '../shared/utils/imageReencode.js';

// Storage and database operations the migration needs; injected so the logic is testable.
export interface MigrationDeps {
  listings(): AsyncIterable<{ id: string; images: Array<{ key: string; url: string; thumbUrl?: string }> }>;
  exists(objectKey: string): Promise<boolean>;
  read(objectKey: string): Promise<Buffer | null>; // null when the object does not exist
  write(objectKey: string, body: Buffer, contentType: string): Promise<void>;
  remove(objectKey: string): Promise<void>;
  setImageUrls(listingId: string, urls: Record<string, string>): Promise<void>;
  setThumbUrls(listingId: string, urls: Record<string, string>): Promise<void>;
  log(message: string): void;
}

export interface MigrationOptions { dryRun: boolean; keepLegacy: boolean; publicUrl?: string }
export interface MigrationSummary { migrated: number; alreadyMigrated: number; missing: number; failed: number; urlsRewritten: number; thumbsCreated: number }

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
// Every photo without a small copy (thumbs/) gets one, and its thumbUrl is recorded.
export async function migrateListingImages(deps: MigrationDeps, options: MigrationOptions): Promise<MigrationSummary> {
  const summary: MigrationSummary = { migrated: 0, alreadyMigrated: 0, missing: 0, failed: 0, urlsRewritten: 0, thumbsCreated: 0 };
  for await (const listing of deps.listings()) {
    const newUrls: Record<string, string> = {};
    const newThumbUrls: Record<string, string> = {};
    for (const image of listing.images) {
      const target = `${LISTING_IMAGE_OBJECT_PREFIX}${image.key}`;
      const thumbTarget = `${LISTING_IMAGE_OBJECT_PREFIX}${LISTING_IMAGE_THUMB_SUBPATH}${image.key}`;
      // The small copy is served from the same base as the full photo: the new public URL when
      // given, otherwise the folder the photo's current URL points at.
      const base = options.publicUrl ? options.publicUrl.replace(/\/$/, '') : image.url.slice(0, image.url.lastIndexOf('/'));
      if (options.publicUrl) {
        const url = `${base}/${encodeURIComponent(image.key)}`;
        if (image.url !== url) newUrls[image.key] = url;
      }
      const thumbUrl = `${base}/${LISTING_IMAGE_THUMB_SUBPATH}${encodeURIComponent(image.key)}`;

      let full: Buffer | null = null;
      if (await deps.exists(target)) {
        summary.alreadyMigrated += 1;
        if (image.thumbUrl === thumbUrl && await deps.exists(thumbTarget)) continue;
        full = await deps.read(target);
        if (!full) continue;
      } else {
        const original = await deps.read(image.key);
        if (!original) { summary.missing += 1; deps.log(`Missing object for listing ${listing.id}: ${image.key}`); continue; }
        try {
          full = await isCleanWebp(original) ? original : await reencodeImage(original, { maxDimension: LISTING_IMAGE_MAX_DIMENSION_PX, output: 'webp', quality: LISTING_IMAGE_OUTPUT_QUALITY });
        } catch (error) {
          summary.failed += 1;
          deps.log(`Could not re-encode ${image.key} (listing ${listing.id}): ${error instanceof InvalidImageError ? error.message : String(error)}. Left in place.`);
          continue;
        }
        if (!options.dryRun) {
          await deps.write(target, full, 'image/webp');
          if (!options.keepLegacy) await deps.remove(image.key);
        }
        summary.migrated += 1;
      }

      if (!(await deps.exists(thumbTarget))) {
        try {
          const thumb = await reencodeImage(full, { maxDimension: LISTING_IMAGE_THUMB_MAX_DIMENSION_PX, output: 'webp', quality: LISTING_IMAGE_THUMB_QUALITY });
          if (!options.dryRun) await deps.write(thumbTarget, thumb, 'image/webp');
          summary.thumbsCreated += 1;
        } catch (error) {
          summary.failed += 1;
          deps.log(`Could not make a small copy of ${image.key} (listing ${listing.id}): ${String(error)}.`);
          continue;
        }
      }
      if (image.thumbUrl !== thumbUrl) newThumbUrls[image.key] = thumbUrl;
    }
    if (Object.keys(newUrls).length) {
      if (!options.dryRun) await deps.setImageUrls(listing.id, newUrls);
      summary.urlsRewritten += Object.keys(newUrls).length;
    }
    if (Object.keys(newThumbUrls).length && !options.dryRun) await deps.setThumbUrls(listing.id, newThumbUrls);
  }
  return summary;
}

// Update pipeline that sets `field` (url or thumbUrl) on each of a listing's images whose key is in
// `values`, leaving the other images untouched. The values travel as a literal list of {k, v} pairs
// matched with $filter: photo keys contain dots ("…jpg"), which MongoDB would otherwise read as
// field paths and refuse.
export function imageFieldUpdate(field: 'url' | 'thumbUrl', values: Record<string, string>) {
  const pairs = Object.entries(values).map(([k, v]) => ({ k, v }));
  const match = { $arrayElemAt: [{ $filter: { input: { $literal: pairs }, as: 'pair', cond: { $eq: ['$$pair.k', '$$image.key'] } } }, 0] };
  return [{
    $set: {
      images: {
        $map: {
          input: '$images', as: 'image',
          in: { $let: { vars: { match }, in: { $cond: [{ $ifNull: ['$$match', false] }, { $mergeObjects: ['$$image', { [field]: '$$match.v' }] }, '$$image'] } } },
        },
      },
    },
  }];
}
