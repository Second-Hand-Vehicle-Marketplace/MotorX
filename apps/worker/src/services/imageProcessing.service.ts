import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import * as unzipper from 'unzipper';
import { LISTING_IMAGE_OBJECT_PREFIX, normalizeRegistrationNumber } from '@motorx/shared-contracts';
import { env } from '../config/env.js';
import { workerStorageClient, workerStorageConfig } from '../config/storage.js';
import { appendListingImages, findListingsByUploadJob, type WorkerListingImage } from '../repositories/listing.repository.js';
import { claimPendingImageProcessing, completeImageProcessing, failImageProcessing, renewImageLease, retryImageProcessing } from '../repositories/uploadJob.repository.js';
import { trackLease, untrackLease } from './activeLeases.js';
import { reencodeListingPhoto } from './imageReencode.js';
import { holdLease, LeaseLostError } from './jobLease.js';
import { notifyImageProcessingResult } from './notification.service.js';
import { isTransientError } from './transientError.js';

// The archive itself is unusable (not a zip, too many files, too large when expanded). Retrying
// cannot help, so the job fails at once instead of spending its retry budget.
export class InvalidArchiveError extends Error { constructor(message: string) { super(message); this.name = 'InvalidArchiveError'; } }

// Downloads the private zip as one buffer. Bounded by the backend's zip size cap at upload time,
// so buffering the whole archive here (rather than streaming) keeps the extraction logic simple.
async function downloadZipBuffer(storageKey: string): Promise<Buffer> {
  const object = await workerStorageClient.send(new GetObjectCommand({ Bucket: workerStorageConfig.bucket, Key: storageKey }));
  if (!object.Body) throw new Error('The stored vehicle photos zip is unavailable.');
  return Buffer.from(await object.Body.transformToByteArray());
}

// path is the entry's location inside the zip; contentHash identifies its original bytes.
interface ZipImageEntry { fileName: string; path: string; contentHash: string; buffer: Buffer; mimeType: string }

function imageMimeType(buffer: Buffer): string | undefined {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return undefined;
}

// Reads a zip entry while enforcing limitBytes as it decompresses, rather than after fully
// inflating it — a hand-crafted entry can lie about its declared size, so the only way to cap
// actual memory use against a decompression bomb is to stop reading mid-stream once the real
// byte count crosses the limit, instead of trusting metadata or buffering first.
function readEntryWithinLimit(entry: unzipper.File, limitBytes: number): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const stream = entry.stream();
    const chunks: Buffer[] = [];
    let total = 0;
    let overLimit = false;
    stream.on('data', (chunk: Buffer) => {
      if (overLimit) return;
      total += chunk.length;
      if (total > limitBytes) {
        overLimit = true;
        stream.destroy();
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });
    stream.on('close', () => { if (!overLimit) resolve(Buffer.concat(chunks)); });
    stream.on('error', (error) => { if (!overLimit) reject(error); });
  });
}

// Extracts image entries from the zip, grouped by their top-level folder name (the dealer's
// registration number for that vehicle, per apps/frontend's upload instructions). Root-level
// files (no folder), non-image files, and oversized images are silently skipped — a hand-built
// zip may legitimately contain extras, and one bad file shouldn't fail the whole batch.
async function extractImageEntries(zipBuffer: Buffer): Promise<Map<string, ZipImageEntry[]>> {
  let directory: Awaited<ReturnType<typeof unzipper.Open.buffer>>;
  try { directory = await unzipper.Open.buffer(zipBuffer); }
  catch (error) { throw new InvalidArchiveError(`The vehicle photos file is not a readable zip archive (${error instanceof Error ? error.message : 'unknown error'}).`); }
  const grouped = new Map<string, ZipImageEntry[]>();
  let entryCount = 0;
  let expandedBytes = 0;
  for (const entry of directory.files) {
    if (entry.type !== 'File') continue;
    entryCount += 1;
    if (entryCount > workerStorageConfig.maxZipEntries) throw new InvalidArchiveError('The vehicle photos archive contains too many files.');
    // The ZIP spec mandates '/' as the internal path separator, but PowerShell's
    // Compress-Archive (a common way for Windows-based dealers to build this zip) writes '\'
    // instead — normalize both so folder/file grouping works regardless of how the zip was made.
    const segments = entry.path.split(/[/\\]/).filter(Boolean);
    if (segments.length < 2) continue;
    const folderRaw = segments[0]!;
    const fileName = segments[segments.length - 1]!;
    const extension = fileName.split('.').pop() ?? '';
    const mimeType = workerStorageConfig.mimeTypeForExtension(extension);
    if (!mimeType) continue;
    const remainingBudget = workerStorageConfig.maxZipExpandedBytes - expandedBytes;
    const perEntryLimit = Math.max(0, Math.min(workerStorageConfig.maxImageBytes, remainingBudget));
    const buffer = await readEntryWithinLimit(entry, perEntryLimit);
    if (buffer === null) throw new InvalidArchiveError('The vehicle photos archive exceeds its expanded size limit.');
    expandedBytes += buffer.length;
    const actualMimeType = imageMimeType(buffer);
    if (!actualMimeType || actualMimeType !== mimeType) continue;
    // Store only a re-encoded copy; files that fail to decode or exceed the pixel cap are skipped.
    const webp = await reencodeListingPhoto(buffer);
    if (!webp) continue;
    const folder = normalizeRegistrationNumber(folderRaw);
    const list = grouped.get(folder) ?? [];
    list.push({ fileName, path: segments.join('/'), contentHash: createHash('sha256').update(buffer).digest('hex'), buffer: webp, mimeType: 'image/webp' });
    grouped.set(folder, list);
  }
  return grouped;
}

// The same photo from the same upload always gets the same storage key, so a retry after a crash
// overwrites the object it already wrote (no orphans) and recognises photos it already attached.
// Formatted like a UUID to satisfy the public image-key format.
export function deterministicImageKey(uploadJobId: string, listingId: string, entry: Pick<ZipImageEntry, 'path' | 'contentHash'>) {
  const hex = createHash('sha256').update(`${uploadJobId}\n${listingId}\n${entry.path}\n${entry.contentHash}`).digest('hex');
  return `${listingId}-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}.webp`;
}

// Uploads one re-encoded photo under its deterministic key and returns its ListingImage metadata.
async function uploadImage(key: string, order: number, entry: ZipImageEntry): Promise<WorkerListingImage> {
  await workerStorageClient.send(new PutObjectCommand({ Bucket: workerStorageConfig.bucket, Key: `${LISTING_IMAGE_OBJECT_PREFIX}${key}`, Body: entry.buffer, ContentType: entry.mimeType, CacheControl: 'public, max-age=31536000, immutable' }));
  return { key, url: `${workerStorageConfig.publicUrl}/${encodeURIComponent(key)}`, alt: entry.fileName, order };
}

// Downloads, extracts, matches, and attaches a vehicle-photos zip to the listings this exact
// upload job created — matched by normalized registration number (the zip's folder names), so a
// zip can never attach photos to another dealer's or another job's listings. Safe to retry at
// any point: photos already attached by an earlier attempt are recognised by their key.
export async function processInventoryImages(uploadJobId: string) {
  const owner = randomUUID();
  const job = await claimPendingImageProcessing(uploadJobId, owner);
  if (!job) {
    // See the matching comment in uploadJob.service.ts's extractInventoryUpload — a claim miss
    // here is not this attempt's problem to solve; the lease reaper handles genuine recovery.
    console.warn('Image-processing job claim missed; already claimed, terminal, or lease still active.', { uploadJobId });
    return { uploadJobId, stage: 'skipped' as const };
  }
  const claimed = job as unknown as { imageZipStorageKey: string; dealerId: Types.ObjectId; imageAttemptCount: number };
  const lease = holdLease(uploadJobId, owner, renewImageLease);
  trackLease(uploadJobId, 'images', owner);
  try {
    const zipBuffer = await downloadZipBuffer(claimed.imageZipStorageKey);
    const grouped = await extractImageEntries(zipBuffer);
    const listings = await findListingsByUploadJob(new Types.ObjectId(uploadJobId));
    const listingsByRegistration = new Map(listings.map((listing: any) => [listing.normalizedRegistrationNumber as string, listing]));

    let imagesAttached = 0; let matchedListings = 0; const unmatchedFolders: string[] = [];
    for (const [folder, entries] of grouped) {
      lease.assertHeld();
      const listing = listingsByRegistration.get(folder);
      if (!listing) { unmatchedFolders.push(folder); continue; }
      matchedListings += 1;
      const listingId = String((listing as any)._id);
      const existing = ((listing as any).images as Array<{ key: string }> | undefined) ?? [];
      const existingKeys = new Set(existing.map((image) => image.key));
      const keyed = entries.map((entry) => ({ entry, key: deterministicImageKey(uploadJobId, listingId, entry) }));
      const alreadyAttached = keyed.filter(({ key }) => existingKeys.has(key));
      const capacity = Math.max(0, workerStorageConfig.maxListingImages - existing.length);
      const toAttach = keyed.filter(({ key }) => !existingKeys.has(key)).slice(0, capacity);
      imagesAttached += alreadyAttached.length;
      if (!toAttach.length) continue;
      const images = await Promise.all(toAttach.map(({ entry, key }, index) => uploadImage(key, existing.length + index, entry)));
      const result = await appendListingImages((listing as any)._id, images, workerStorageConfig.maxListingImages);
      if (result?.modifiedCount === 1) { imagesAttached += images.length; continue; }
      // Not attached (the listing changed meanwhile): remove the objects so none are left untracked.
      await Promise.allSettled(images.map(({ key }) => workerStorageClient.send(new DeleteObjectCommand({ Bucket: workerStorageConfig.bucket, Key: `${LISTING_IMAGE_OBJECT_PREFIX}${key}` }))));
    }

    lease.assertHeld();
    if (!(await completeImageProcessing(uploadJobId, owner, { imagesAttached, matchedListings, unmatchedFolders }))) throw new LeaseLostError(uploadJobId);
    const status = unmatchedFolders.length > 0 ? 'completedWithErrors' as const : 'completed' as const;
    await notifyImageProcessingResult(claimed.dealerId, status, unmatchedFolders.length);
    return { uploadJobId, imagesAttached, matchedListings, unmatchedFolders, stage: 'completed' as const };
  } catch (error) {
    if (error instanceof LeaseLostError) {
      console.warn(error.message);
      return { uploadJobId, stage: 'lease-lost' as const };
    }
    const message = error instanceof Error ? error.message : 'Unknown image processing failure.';
    if (!(error instanceof InvalidArchiveError) && isTransientError(error) && claimed.imageAttemptCount < env.JOB_MAX_RECLAIM_ATTEMPTS) {
      await retryImageProcessing(uploadJobId, owner, message);
      throw error; // BullMQ schedules the next attempt with exponential backoff and jitter.
    }
    if (await failImageProcessing(uploadJobId, message, owner)) await notifyImageProcessingResult(claimed.dealerId, 'failed', undefined, message);
    return { uploadJobId, stage: 'failed' as const, message };
  } finally {
    lease.stop();
    untrackLease(owner);
  }
}
