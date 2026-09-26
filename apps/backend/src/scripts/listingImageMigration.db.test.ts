import '../test/env.js';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDb, connectTestDb, disconnectTestDb } from '../test/db.js';
import { ListingModel } from '../modules/marketplace/listing.model.js';
import { imageFieldUpdate } from './listingImageMigration.js';

// The fake-storage tests in listingImageMigration.test.ts cannot catch MongoDB's own rules; this one
// runs the real update. Real photo keys contain dots ("…-uuid.jpg"), which once made it fail.
describe('listing image URL updates (real MongoDB)', () => {
  beforeAll(async () => { await connectTestDb(); await ListingModel.init(); });
  afterAll(disconnectTestDb);
  afterEach(clearTestDb);

  const keyA = `${new mongoose.Types.ObjectId()}-fe2b372e-a4b1-45c0-8198-3839ee38ff4b.jpg`;
  const keyB = `${new mongoose.Types.ObjectId()}-11111111-2222-3333-4444-555555555555.webp`;

  async function listing() {
    return ListingModel.create({
      dealerId: new mongoose.Types.ObjectId(), registrationNumber: 'CAX-1234', normalizedRegistrationNumber: 'CAX1234', title: 'Toyota Aqua', make: 'Toyota', model: 'Aqua', year: 2018,
      category: 'car', price: 6_000_000, currency: 'LKR', location: 'Colombo', status: 'active',
      attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 60_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1_500 },
      images: [{ key: keyA, url: `http://old-host/${keyA}`, order: 0 }, { key: keyB, url: `http://old-host/${keyB}`, order: 1 }],
    });
  }

  it('sets the small-copy URL only on the listed photos, even though their keys contain dots', async () => {
    const created = await listing();

    await ListingModel.updateOne({ _id: created._id }, imageFieldUpdate('thumbUrl', { [keyA]: `http://cdn/thumbs/${keyA}` }));

    const saved = (await ListingModel.findById(created._id).lean<{ images: Array<{ key: string; url: string; thumbUrl?: string; order: number }> }>())!;
    expect(saved.images[0]).toMatchObject({ key: keyA, url: `http://old-host/${keyA}`, thumbUrl: `http://cdn/thumbs/${keyA}`, order: 0 });
    expect(saved.images[1]).not.toHaveProperty('thumbUrl');
  });

  it('rewrites photo URLs and keeps every other image field', async () => {
    const created = await listing();

    await ListingModel.updateOne({ _id: created._id }, imageFieldUpdate('url', { [keyA]: `http://cdn/${keyA}`, [keyB]: `http://cdn/${keyB}` }));

    const saved = (await ListingModel.findById(created._id).lean<{ images: Array<{ key: string; url: string; order: number }> }>())!;
    expect(saved.images.map((image) => [image.key, image.url, image.order])).toEqual([[keyA, `http://cdn/${keyA}`, 0], [keyB, `http://cdn/${keyB}`, 1]]);
  });
});
