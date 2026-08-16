import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  storageSend: vi.fn(),
  claimImage: vi.fn(), completeImage: vi.fn(), failImage: vi.fn(),
  findListings: vi.fn(), appendImages: vi.fn(),
  unzipperOpenBuffer: vi.fn(),
}));

function fakeEntry(path: string, type: 'File' | 'Directory', content: Buffer) {
  return { path, type, buffer: async () => content };
}

vi.mock('../config/storage.js', () => ({
  workerStorageClient: { send: mocks.storageSend },
  workerStorageConfig: {
    bucket: 'test-bucket', publicUrl: 'http://localhost/images', maxListingImages: 3, maxImageBytes: 1_000_000,
    mimeTypeForExtension: (extension: string) => ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as Record<string, string>)[extension.toLowerCase()],
  },
}));
vi.mock('../repositories/uploadJob.repository.js', () => ({ claimPendingImageProcessing: mocks.claimImage, completeImageProcessing: mocks.completeImage, failImageProcessing: mocks.failImage }));
vi.mock('../repositories/listing.repository.js', () => ({ findListingsByUploadJob: mocks.findListings, appendListingImages: mocks.appendImages }));
vi.mock('unzipper', () => ({ Open: { buffer: mocks.unzipperOpenBuffer } }));
vi.mock('./notification.service.js', () => ({ notifyImageProcessingResult: vi.fn() }));

import { processInventoryImages } from './imageProcessing.service.js';

const uploadJobId = new Types.ObjectId().toString();
const jpeg = Buffer.from([0xff, 0xd8, 0xff]);

describe('inventory image processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.claimImage.mockResolvedValue({ imageZipStorageKey: 'inventory/dealer/upload/photos.zip' });
    mocks.storageSend.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } });
    mocks.completeImage.mockResolvedValue(undefined);
    mocks.appendImages.mockResolvedValue(undefined);
  });

  it('matches a zip folder to a listing by normalized registration number and attaches images', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [
      fakeEntry('CAX-1234/photo1.jpg', 'File', jpeg),
      fakeEntry('CAX-1234/photo2.jpg', 'File', jpeg),
    ] });
    const listingId = new Types.ObjectId();
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ imagesAttached: 2, matchedListings: 1, unmatchedFolders: [] });
    expect(mocks.appendImages).toHaveBeenCalledWith(listingId, expect.arrayContaining([expect.objectContaining({ order: 0 }), expect.objectContaining({ order: 1 })]));
    expect(mocks.completeImage).toHaveBeenCalledWith(uploadJobId, { imagesAttached: 2, matchedListings: 1, unmatchedFolders: [] });
  });

  it('groups entries whose zip path uses backslashes (PowerShell Compress-Archive) the same as forward slashes', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('CAX-1234\\photo1.jpg', 'File', jpeg)] });
    const listingId = new Types.ObjectId();
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ imagesAttached: 1, matchedListings: 1, unmatchedFolders: [] });
  });

  it('records a folder that matches no listing from this upload job as unmatched', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('CBY-9999/photo1.jpg', 'File', jpeg)] });
    mocks.findListings.mockResolvedValue([{ _id: new Types.ObjectId(), normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ imagesAttached: 0, matchedListings: 0, unmatchedFolders: ['CBY9999'] });
    expect(mocks.appendImages).not.toHaveBeenCalled();
  });

  it('skips root-level files with no folder and non-image files', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [
      fakeEntry('readme.txt', 'File', Buffer.from('hello')),
      fakeEntry('CAX-1234/notes.txt', 'File', Buffer.from('hello')),
      fakeEntry('CAX-1234/photo.jpg', 'File', jpeg),
    ] });
    const listingId = new Types.ObjectId();
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ imagesAttached: 1, matchedListings: 1 });
  });

  it('caps attached images at the configured per-listing limit, accounting for existing images', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [
      fakeEntry('CAX-1234/a.jpg', 'File', jpeg), fakeEntry('CAX-1234/b.jpg', 'File', jpeg), fakeEntry('CAX-1234/c.jpg', 'File', jpeg),
    ] });
    const listingId = new Types.ObjectId();
    // maxListingImages is 3 (mocked above) and this listing already has 2 images.
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: [{ key: 'a' }, { key: 'b' }] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result.imagesAttached).toBe(1);
    expect(mocks.appendImages).toHaveBeenCalledWith(listingId, expect.arrayContaining([expect.objectContaining({ order: 2 })]));
  });

  it('marks the job failed when the zip cannot be downloaded', async () => {
    mocks.storageSend.mockRejectedValue(new Error('S3 unavailable'));
    await expect(processInventoryImages(uploadJobId)).rejects.toThrow('S3 unavailable');
    expect(mocks.failImage).toHaveBeenCalledWith(uploadJobId, 'S3 unavailable');
    expect(mocks.completeImage).not.toHaveBeenCalled();
  });
});
