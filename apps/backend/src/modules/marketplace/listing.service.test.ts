import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { CarAttributes } from '@motorx/shared-contracts';
import { clearTestDb, connectTestDb, disconnectTestDb } from '../../test/db.js';
import { ListingModel } from './listing.model.js';
import type { CreateListingBody } from './listing.validation.js';

// listing.service.ts transitively imports config/env.ts, which eagerly validates the full
// backend env schema (Firebase, S3, SMTP, ...) at import time — none of which this test
// actually exercises. Stub harmless values (only if unset) so the module loads under test,
// mirroring how a real deployment's env would already be fully populated. Done via a deferred
// dynamic import: static imports are hoisted and would evaluate before these assignments run.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/unused'; // env.ts requires it, but connectTestDb() below uses TEST_MONGODB_URI instead
process.env.FIREBASE_PROJECT_ID ??= 'test-project';
process.env.FIREBASE_CLIENT_EMAIL ??= 'test@example.com';
process.env.FIREBASE_PRIVATE_KEY ??= 'test-key';
process.env.S3_ENDPOINT ??= 'http://localhost:9000';
process.env.S3_BUCKET ??= 'test-bucket';
process.env.S3_ACCESS_KEY ??= 'test-access-key';
process.env.S3_SECRET_KEY ??= 'test-secret-key';
process.env.SMTP_HOST ??= 'localhost';
process.env.SMTP_USER ??= 'test';
process.env.SMTP_PASS ??= 'test';
const { createDealerListing, updateDealerListing } = await import('./listing.service.js');

describe('listing service — updateDealerListing', () => {
  beforeAll(async () => {
    await connectTestDb();
    await ListingModel.init();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  const dealerId = new mongoose.Types.ObjectId();
  const carAttributes: CarAttributes = { bodyType: 'sedan', condition: 'used', mileageKm: 45_000, fuelType: 'petrol', transmission: 'automatic', engineCapacityCc: 1_800 };

  async function createTestListing(overrides: Partial<CreateListingBody> = {}) {
    const input = {
      registrationNumber: 'CAX-1234', title: 'Toyota Corolla 2020', make: 'Toyota', model: 'Corolla', year: 2020,
      price: 8_500_000, currency: 'LKR', location: 'Colombo', category: 'car', attributes: carAttributes,
      status: 'draft', description: 'A well-maintained sedan.',
      ...overrides,
    } as CreateListingBody;
    return createDealerListing(dealerId, input);
  }

  // Regression test for a bug where clearing description built a MongoDB update that both
  // $set and $unset the same field, which Mongo rejects outright (error 40) — so the request
  // failed and the field was never actually cleared.
  it('clears the description when updated to null', async () => {
    const created = await createTestListing();
    expect(created.description).toBe('A well-maintained sedan.');

    const updated = await updateDealerListing(created.id, dealerId, { description: null });

    expect(updated.description).toBeNull();
  });

  it('still updates the description to a new value', async () => {
    const created = await createTestListing();
    const updated = await updateDealerListing(created.id, dealerId, { description: 'Updated description.' });
    expect(updated.description).toBe('Updated description.');
  });
});
