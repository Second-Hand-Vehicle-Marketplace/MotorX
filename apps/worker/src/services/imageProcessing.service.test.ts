import { Types } from 'mongoose';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  storageSend: vi.fn(),
  claimImage: vi.fn(), completeImage: vi.fn(), failImage: vi.fn(), retryImage: vi.fn(), renewImage: vi.fn(), notifyResult: vi.fn(),
  findListings: vi.fn(), appendImages: vi.fn(),
  unzipperOpenBuffer: vi.fn(),
}));

function fakeEntry(path: string, type: 'File' | 'Directory', content: Buffer) {
  return { path, type, buffer: async () => content, stream: () => Readable.from([content]) };
}

vi.mock('../config/storage.js', () => ({
  workerStorageClient: { send: mocks.storageSend },
  workerStorageConfig: {
    bucket: 'test-bucket', publicUrl: 'http://localhost/images', maxListingImages: 3, maxImageBytes: 1_000_000, maxZipEntries: 2_000, maxZipExpandedBytes: 10_000_000,
    mimeTypeForExtension: (extension: string) => ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as Record<string, string>)[extension.toLowerCase()],
  },
}));
vi.mock('../config/env.js', () => ({ env: { JOB_MAX_RECLAIM_ATTEMPTS: 5 } }));
vi.mock('../repositories/uploadJob.repository.js', () => ({ JOB_LEASE_MS: 120_000, claimPendingImageProcessing: mocks.claimImage, completeImageProcessing: mocks.completeImage, failImageProcessing: mocks.failImage, retryImageProcessing: mocks.retryImage, renewImageLease: mocks.renewImage }));
vi.mock('../repositories/listing.repository.js', () => ({ findListingsByUploadJob: mocks.findListings, appendListingImages: mocks.appendImages }));
vi.mock('unzipper', () => ({ Open: { buffer: mocks.unzipperOpenBuffer } }));
vi.mock('./notification.service.js', () => ({ notifyImageProcessingResult: mocks.notifyResult }));

import sharp from 'sharp';
import { deterministicImageKey, processInventoryImages } from './imageProcessing.service.js';

const uploadJobId = new Types.ObjectId().toString();
// A real (tiny) JPEG carrying EXIF GPS coordinates, like a phone photo taken at a dealer's home.
const jpeg = await sharp({ create: { width: 64, height: 40, channels: 3, background: '#4a6fa5' } })
  .jpeg()
  .withExif({ IFD0: { Make: 'TestPhone' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '6/1 55/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '79/1 51/1 0/1' } })
  .toBuffer();
// Uploaded objects are every storage call after the initial zip download.
const storedObjects = () => mocks.storageSend.mock.calls.slice(1).map(([command]) => command.input as { Key: string; Body: Buffer; ContentType: string });

describe('inventory image processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.claimImage.mockResolvedValue({ imageZipStorageKey: 'inventory/dealer/upload/photos.zip', imageAttemptCount: 1 });
    mocks.storageSend.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } });
    mocks.completeImage.mockResolvedValue(true); mocks.failImage.mockResolvedValue(true); mocks.retryImage.mockResolvedValue(true);
    mocks.appendImages.mockResolvedValue({ modifiedCount: 1 });
  });

  it('matches a zip folder to a listing by normalized registration number and attaches images', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({
      files: [
        fakeEntry('CAX-1234/photo1.png', 'File', jpeg),
        fakeEntry('CAX-1234/photo2.png', 'File', jpeg),
      ]
    });
    const listingId = new Types.ObjectId();
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ imagesAttached: 2, matchedListings: 1, unmatchedFolders: [] });
    expect(mocks.appendImages).toHaveBeenCalledWith(listingId, expect.arrayContaining([expect.objectContaining({ order: 0 }), expect.objectContaining({ order: 1 })]), 3);
    expect(mocks.completeImage).toHaveBeenCalledWith(uploadJobId, expect.any(String), { imagesAttached: 2, matchedListings: 1, unmatchedFolders: [] });
  });

  it('groups entries whose zip path uses backslashes (PowerShell Compress-Archive) the same as forward slashes', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('CAX-1234\\photo1.jpg', 'File', jpeg)] });
    const listingId = new Types.ObjectId();
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ imagesAttached: 1, matchedListings: 1, unmatchedFolders: [] });
  });

  it('matches images when the zip contains an extra wrapper folder', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('PhotoArchive/CAX-1234/photo.jpg', 'File', jpeg)] });
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
    mocks.unzipperOpenBuffer.mockResolvedValue({
      files: [
        fakeEntry('readme.txt', 'File', Buffer.from('hello')),
        fakeEntry('CAX-1234/notes.txt', 'File', Buffer.from('hello')),
        fakeEntry('CAX-1234/photo.jpg', 'File', jpeg),
      ]
    });
    const listingId = new Types.ObjectId();
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ imagesAttached: 1, matchedListings: 1 });
  });

  it('caps attached images at the configured per-listing limit, accounting for existing images', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({
      files: [
        fakeEntry('CAX-1234/a.jpg', 'File', jpeg), fakeEntry('CAX-1234/b.jpg', 'File', jpeg), fakeEntry('CAX-1234/c.jpg', 'File', jpeg),
      ]
    });
    const listingId = new Types.ObjectId();
    // maxListingImages is 3 (mocked above) and this listing already has 2 images.
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: [{ key: 'a' }, { key: 'b' }] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result.imagesAttached).toBe(1);
    expect(mocks.appendImages).toHaveBeenCalledWith(listingId, expect.arrayContaining([expect.objectContaining({ order: 2 })]), 3);
  });

  it('fails immediately (no retry) on an entry that exceeds the expanded size limit, without buffering it in full', async () => {
    // maxImageBytes is 1_000_000 (mocked above). A crafted entry can lie in its declared/central-
    // directory size, so the fix enforces the cap while streaming rather than trusting metadata
    // or buffering the whole entry first — simulate that by emitting more bytes than the cap.
    const oversized = {
      path: 'CAX-1234/photo1.jpg',
      type: 'File' as const,
      buffer: async () => { throw new Error('buffer() should not be called by the streaming size check.'); },
      stream: () => Readable.from((function* () {
        const chunk = Buffer.alloc(400_000, 1);
        for (let i = 0; i < 4; i += 1) yield chunk; // 1.6MB total, over the 1MB cap
      })()),
    };
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [oversized] });
    mocks.findListings.mockResolvedValue([{ _id: new Types.ObjectId(), normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    await expect(processInventoryImages(uploadJobId)).resolves.toMatchObject({ stage: 'failed', message: expect.stringContaining('exceeds its expanded size limit') });
    expect(mocks.appendImages).not.toHaveBeenCalled();
    expect(mocks.retryImage).not.toHaveBeenCalled();
  });

  it('stores a re-encoded WebP with all metadata (including GPS location) removed', async () => {
    expect((await sharp(jpeg).metadata()).exif).toBeDefined(); // the fixture really carries EXIF
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('CAX-1234/photo.jpg', 'File', jpeg)] });
    mocks.findListings.mockResolvedValue([{ _id: new Types.ObjectId(), normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    await processInventoryImages(uploadJobId);

    const [stored] = storedObjects();
    expect(stored.Key).toMatch(/\.webp$/);
    expect(stored.ContentType).toBe('image/webp');
    const metadata = await sharp(stored.Body).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.exif).toBeUndefined();
  });

  it('skips a file that only starts like a JPEG but cannot be decoded', async () => {
    const fakeJpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('<script>alert(1)</script>')]);
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('CAX-1234/photo.jpg', 'File', fakeJpeg)] });
    mocks.findListings.mockResolvedValue([{ _id: new Types.ObjectId(), normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ imagesAttached: 0 });
    expect(storedObjects()).toHaveLength(0);
  });

  it('skips an image above the pixel cap even when the file itself is small', async () => {
    // 6400 x 6400 = 41 megapixels (over the 40 MP cap) of one colour: a tiny PNG on disk that
    // would need over 120 MB of memory to decode.
    const bomb = await sharp({ create: { width: 6400, height: 6400, channels: 3, background: '#000000' } }).png({ compressionLevel: 9 }).toBuffer();
    expect(bomb.length).toBeLessThan(1_000_000);
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('CAX-1234/huge.png', 'File', bomb)] });
    mocks.findListings.mockResolvedValue([{ _id: new Types.ObjectId(), normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ imagesAttached: 0 });
  });

  it('shrinks large photos to the maximum stored dimension', async () => {
    const large = await sharp({ create: { width: 4000, height: 2400, channels: 3, background: '#336699' } }).jpeg().toBuffer();
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('CAX-1234/large.jpg', 'File', large)] });
    mocks.findListings.mockResolvedValue([{ _id: new Types.ObjectId(), normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    await processInventoryImages(uploadJobId);

    const { width, height } = await sharp(storedObjects()[0]!.Body).metadata();
    expect([width, height]).toEqual([2560, 1536]);
  });

  it('also stores an 800 px small copy for cards and phones, and links it on the listing', async () => {
    const large = await sharp({ create: { width: 4000, height: 2400, channels: 3, background: '#336699' } }).jpeg().toBuffer();
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('CAX-1234/large.jpg', 'File', large)] });
    mocks.findListings.mockResolvedValue([{ _id: new Types.ObjectId(), normalizedRegistrationNumber: 'CAX1234', images: [] }]);

    await processInventoryImages(uploadJobId);

    const [full, thumb] = storedObjects();
    expect(thumb!.Key).toBe(full!.Key.replace('listing-images/', 'listing-images/thumbs/'));
    expect((await sharp(thumb!.Body).metadata()).width).toBe(800);
    const [attached] = mocks.appendImages.mock.calls[0]![1] as Array<{ key: string; thumbUrl?: string }>;
    expect(attached!.thumbUrl).toMatch(new RegExp(`/thumbs/${attached!.key}$`));
  });

  it('retries a temporary storage failure with backoff instead of failing the job', async () => {
    mocks.storageSend.mockRejectedValue(Object.assign(new Error('Service Unavailable'), { name: 'ServiceUnavailable', $metadata: { httpStatusCode: 503 } }));
    await expect(processInventoryImages(uploadJobId)).rejects.toThrow('Service Unavailable');
    expect(mocks.retryImage).toHaveBeenCalledWith(uploadJobId, expect.any(String), 'Service Unavailable');
    expect(mocks.failImage).not.toHaveBeenCalled();
    expect(mocks.notifyResult).not.toHaveBeenCalled();
  });

  it('fails immediately when the upload is not a zip archive at all', async () => {
    mocks.unzipperOpenBuffer.mockRejectedValue(new Error('invalid signature: 0x6c6c6568'));
    await expect(processInventoryImages(uploadJobId)).resolves.toMatchObject({ stage: 'failed' });
    expect(mocks.failImage).toHaveBeenCalledWith(uploadJobId, expect.stringContaining('not a readable zip'), expect.any(String));
    expect(mocks.retryImage).not.toHaveBeenCalled();
  });

  it('is idempotent: a retry after a crash does not attach the same photos again', async () => {
    const listingId = new Types.ObjectId();
    const files = () => [fakeEntry('CAX-1234/a.jpg', 'File', jpeg), fakeEntry('CAX-1234/b.jpg', 'File', jpeg)];
    // First attempt attaches both photos (and then, say, crashes before marking the job complete).
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: files() });
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: [] }]);
    await processInventoryImages(uploadJobId);
    const firstKeys = (mocks.appendImages.mock.calls[0]![1] as Array<{ key: string }>).map((image) => image.key);

    // Retry: the listing now holds those photos. Same zip, same keys, so nothing is attached twice.
    vi.clearAllMocks();
    mocks.claimImage.mockResolvedValue({ imageZipStorageKey: 'inventory/dealer/upload/photos.zip', imageAttemptCount: 2 });
    mocks.storageSend.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } });
    mocks.completeImage.mockResolvedValue(true);
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: files() });
    mocks.findListings.mockResolvedValue([{ _id: listingId, normalizedRegistrationNumber: 'CAX1234', images: firstKeys.map((key) => ({ key })) }]);
    const retry = await processInventoryImages(uploadJobId);

    expect(mocks.appendImages).not.toHaveBeenCalled();
    expect(storedObjects()).toHaveLength(0);
    expect(retry).toMatchObject({ imagesAttached: 2, stage: 'completed' }); // still reports both as attached
  });

  it('derives the same key for the same photo and a different key for different content', () => {
    const listingId = new Types.ObjectId().toString();
    const key = deterministicImageKey(uploadJobId, listingId, { path: 'CAX-1234/a.jpg', contentHash: 'abc' });
    expect(deterministicImageKey(uploadJobId, listingId, { path: 'CAX-1234/a.jpg', contentHash: 'abc' })).toBe(key);
    expect(deterministicImageKey(uploadJobId, listingId, { path: 'CAX-1234/a.jpg', contentHash: 'def' })).not.toBe(key);
    expect(key).toMatch(/^[a-f\d]{24}-[0-9a-f-]{36}\.webp$/); // accepted by the public image route
  });

  it('fails at once with an actionable reason (not a silent 0/0) when no photo is inside a folder', async () => {
    mocks.unzipperOpenBuffer.mockResolvedValue({ files: [fakeEntry('readme.txt', 'File', Buffer.from('hello')), fakeEntry('photo.jpg', 'File', jpeg)] });

    const result = await processInventoryImages(uploadJobId);

    expect(result).toMatchObject({ stage: 'failed', message: expect.stringContaining('No vehicle photos were found') });
    expect(mocks.failImage).toHaveBeenCalledWith(uploadJobId, expect.stringContaining('No vehicle photos were found'), expect.any(String));
    expect(mocks.retryImage).not.toHaveBeenCalled(); // the layout is wrong; retrying cannot help
    expect(mocks.completeImage).not.toHaveBeenCalled();
    expect(mocks.findListings).not.toHaveBeenCalled();
  });
});
