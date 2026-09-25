import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { migrateListingImages, type MigrationDeps } from './listingImageMigration.js';

// In-memory bucket and listings standing in for S3 and MongoDB.
function fakeWorld(objects: Record<string, Buffer>, listings: Array<{ id: string; images: Array<{ key: string; url: string }> }>) {
  const bucket = new Map(Object.entries(objects));
  const urlUpdates: Array<[string, Record<string, string>]> = [];
  const deps: MigrationDeps = {
    async *listings() { yield* listings; },
    exists: async (key) => bucket.has(key),
    read: async (key) => bucket.get(key) ?? null,
    write: async (key, body) => { bucket.set(key, body); },
    remove: async (key) => { bucket.delete(key); },
    setImageUrls: async (id, urls) => { urlUpdates.push([id, urls]); },
    log: () => undefined,
  };
  return { bucket, urlUpdates, deps };
}

const phonePhoto = () => sharp({ create: { width: 64, height: 40, channels: 3, background: '#4a6fa5' } })
  .jpeg().withExif({ IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '6/1 55/1 0/1' } }).toBuffer();

describe('listing image migration', () => {
  it('moves old photos under listing-images/ as metadata-free WebP and removes the originals', async () => {
    const { bucket, deps } = fakeWorld({ 'l1-a.jpg': await phonePhoto() }, [{ id: 'l1', images: [{ key: 'l1-a.jpg', url: 'http://api/listing-images/l1-a.jpg' }] }]);

    const summary = await migrateListingImages(deps, { dryRun: false, keepLegacy: false });

    expect(summary).toMatchObject({ migrated: 1, alreadyMigrated: 0, failed: 0 });
    expect(bucket.has('l1-a.jpg')).toBe(false);
    const metadata = await sharp(bucket.get('listing-images/l1-a.jpg')!).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.exif).toBeUndefined();
  });

  it('is safe to run again: already migrated photos are skipped', async () => {
    const { deps } = fakeWorld({ 'l1-a.jpg': await phonePhoto() }, [{ id: 'l1', images: [{ key: 'l1-a.jpg', url: 'u' }] }]);

    await migrateListingImages(deps, { dryRun: false, keepLegacy: false });
    const second = await migrateListingImages(deps, { dryRun: false, keepLegacy: false });

    expect(second).toMatchObject({ migrated: 0, alreadyMigrated: 1 });
  });

  it('changes nothing in a dry run', async () => {
    const original = await phonePhoto();
    const { bucket, urlUpdates, deps } = fakeWorld({ 'l1-a.jpg': original }, [{ id: 'l1', images: [{ key: 'l1-a.jpg', url: 'old' }] }]);

    const summary = await migrateListingImages(deps, { dryRun: true, keepLegacy: false, publicUrl: 'https://cdn.example.com' });

    expect(summary).toMatchObject({ migrated: 1, urlsRewritten: 1 });
    expect([...bucket.keys()]).toEqual(['l1-a.jpg']);
    expect(urlUpdates).toHaveLength(0);
  });

  it('points image URLs at the CDN when asked', async () => {
    const { urlUpdates, deps } = fakeWorld({ 'l1-a.jpg': await phonePhoto() }, [{ id: 'l1', images: [{ key: 'l1-a.jpg', url: 'http://api/listing-images/l1-a.jpg' }] }]);

    await migrateListingImages(deps, { dryRun: false, keepLegacy: true, publicUrl: 'https://cdn.example.com/' });

    expect(urlUpdates).toEqual([['l1', { 'l1-a.jpg': 'https://cdn.example.com/l1-a.jpg' }]]);
  });

  it('reports missing and undecodable objects and leaves them in place', async () => {
    const { bucket, deps } = fakeWorld({ 'l1-bad.jpg': Buffer.from('not an image') }, [{ id: 'l1', images: [{ key: 'l1-gone.jpg', url: 'u' }, { key: 'l1-bad.jpg', url: 'u' }] }]);

    const summary = await migrateListingImages(deps, { dryRun: false, keepLegacy: false });

    expect(summary).toMatchObject({ migrated: 0, missing: 1, failed: 1 });
    expect(bucket.has('l1-bad.jpg')).toBe(true);
  });
});
