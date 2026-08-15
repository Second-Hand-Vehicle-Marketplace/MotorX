import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import * as unzipper from 'unzipper';
import { normalizeRegistrationNumber } from '@motorx/shared-contracts';
import { workerStorageClient, workerStorageConfig } from '../config/storage.js';
import { appendListingImages, findListingsByUploadJob, type WorkerListingImage } from '../repositories/listing.repository.js';
import { claimPendingImageProcessing, completeImageProcessing, failImageProcessing } from '../repositories/uploadJob.repository.js';

// Downloads the private zip as one buffer. Bounded by the backend's zip size cap at upload time,
// so buffering the whole archive here (rather than streaming) keeps the extraction logic simple.
async function downloadZipBuffer(storageKey: string): Promise<Buffer> {
  const object = await workerStorageClient.send(new GetObjectCommand({ Bucket: workerStorageConfig.bucket, Key: storageKey }));
  if (!object.Body) throw new Error('The stored vehicle photos zip is unavailable.');
  return Buffer.from(await object.Body.transformToByteArray());
}

interface ZipImageEntry { fileName: string; buffer: Buffer; mimeType: string }

// Extracts image entries from the zip, grouped by their top-level folder name (the dealer's
// registration number for that vehicle, per apps/frontend's upload instructions). Root-level
// files (no folder), non-image files, and oversized images are silently skipped — a hand-built
// zip may legitimately contain extras, and one bad file shouldn't fail the whole batch.
async function extractImageEntries(zipBuffer: Buffer): Promise<Map<string, ZipImageEntry[]>> {
  const directory = await unzipper.Open.buffer(zipBuffer);
  const grouped = new Map<string, ZipImageEntry[]>();
  for (const entry of directory.files) {
    if (entry.type !== 'File') continue;
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
    const buffer = await entry.buffer();
    if (buffer.length > workerStorageConfig.maxImageBytes) continue;
    const folder = normalizeRegistrationNumber(folderRaw);
    const list = grouped.get(folder) ?? [];
    list.push({ fileName, buffer, mimeType });
    grouped.set(folder, list);
  }
  return grouped;
}

// Uploads one image buffer to S3 and returns its ListingImage metadata.
async function uploadImage(listingId: string, order: number, entry: ZipImageEntry): Promise<WorkerListingImage> {
  const extension = entry.mimeType === 'image/jpeg' ? 'jpg' : entry.mimeType.split('/')[1];
  const key = `${listingId}-${randomUUID()}.${extension}`;
  await workerStorageClient.send(new PutObjectCommand({ Bucket: workerStorageConfig.bucket, Key: key, Body: entry.buffer, ContentType: entry.mimeType, CacheControl: 'public, max-age=31536000, immutable' }));
  return { key, url: `${workerStorageConfig.publicUrl}/${encodeURIComponent(key)}`, alt: entry.fileName, order };
}

// Downloads, extracts, matches, and attaches a vehicle-photos zip to the listings this exact
// upload job created — matched by normalized registration number (the zip's folder names), so a
// zip can never attach photos to another dealer's or another job's listings.
export async function processInventoryImages(uploadJobId: string) {
  const job = await claimPendingImageProcessing(uploadJobId);
  if (!job) throw new Error('The image-processing job is missing or is not pending.');
  const claimed = job as unknown as { imageZipStorageKey: string };
  try {
    const zipBuffer = await downloadZipBuffer(claimed.imageZipStorageKey);
    const grouped = await extractImageEntries(zipBuffer);
    const listings = await findListingsByUploadJob(new Types.ObjectId(uploadJobId));
    const listingsByRegistration = new Map(listings.map((listing: any) => [listing.normalizedRegistrationNumber as string, listing]));

    let imagesAttached = 0; let matchedListings = 0; const unmatchedFolders: string[] = [];
    for (const [folder, entries] of grouped) {
      const listing = listingsByRegistration.get(folder);
      if (!listing) { unmatchedFolders.push(folder); continue; }
      matchedListings += 1;
      const existingCount = ((listing as any).images as unknown[] | undefined)?.length ?? 0;
      const capacity = Math.max(0, workerStorageConfig.maxListingImages - existingCount);
      const accepted = entries.slice(0, capacity);
      if (!accepted.length) continue;
      const images = await Promise.all(accepted.map((entry, index) => uploadImage(String((listing as any)._id), existingCount + index, entry)));
      await appendListingImages((listing as any)._id, images);
      imagesAttached += images.length;
    }

    await completeImageProcessing(uploadJobId, { imagesAttached, matchedListings, unmatchedFolders });
    return { uploadJobId, imagesAttached, matchedListings, unmatchedFolders, stage: 'completed' as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown image processing failure.';
    await failImageProcessing(uploadJobId, message);
    throw error;
  }
}
