import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { normalizeRegistrationNumber, type CarAttributes } from '@motorx/shared-contracts';
import { clearTestDb, connectTestDb, disconnectTestDb } from '../../test/db.js';
import { createListingRecord, findActiveListingByRegistration } from './listing.repository.js';
import { ListingModel, type Listing } from './listing.model.js';

describe('listing repository — registration duplicate detection', () => {
  beforeAll(async () => {
    await connectTestDb();
    // Indexes build in the background by default; the race test below depends on the partial
    // unique index already existing, so wait for it explicitly rather than relying on timing.
    await ListingModel.init();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  const carAttributes: CarAttributes = { bodyType: 'sedan', condition: 'used', mileageKm: 45_000, fuelType: 'petrol', transmission: 'automatic', engineCapacityCc: 1_800 };

  const carListing = (overrides: Partial<Omit<Listing, 'createdAt' | 'updatedAt'>> = {}): Omit<Listing, 'createdAt' | 'updatedAt'> => ({
    dealerId: new mongoose.Types.ObjectId(), registrationNumber: 'CAX-1234', normalizedRegistrationNumber: normalizeRegistrationNumber('CAX-1234'),
    title: 'Toyota Corolla 2020', make: 'Toyota', model: 'Corolla', year: 2020, category: 'car',
    price: 8_500_000, currency: 'LKR', location: 'Colombo', attributes: carAttributes,
    images: [], status: 'active',
    ...overrides,
  });

  it('finds an active listing sharing a normalized registration number', async () => {
    await createListingRecord(carListing());
    const found = await findActiveListingByRegistration(normalizeRegistrationNumber('cax 1234'));
    expect(found).not.toBeNull();
  });

  it('does not treat an archived listing as a blocking duplicate', async () => {
    await createListingRecord(carListing({ status: 'archived' }));
    const found = await findActiveListingByRegistration(normalizeRegistrationNumber('CAX-1234'));
    expect(found).toBeNull();
  });

  it('excludes the listing being edited from its own duplicate check', async () => {
    const created = await createListingRecord(carListing());
    const found = await findActiveListingByRegistration(normalizeRegistrationNumber('CAX-1234'), created._id.toString());
    expect(found).toBeNull();
  });

  it('does not match a different registration number', async () => {
    await createListingRecord(carListing());
    const found = await findActiveListingByRegistration(normalizeRegistrationNumber('CBY-9999'));
    expect(found).toBeNull();
  });

  it('rejects a second draft/active listing for the same registration number at the DB level', async () => {
    // This is the race the partial unique index backstops: two requests can both pass the
    // application-level findActiveListingByRegistration check before either write lands, so the
    // real guarantee has to come from the database, not the pre-check alone.
    const [first, second] = await Promise.allSettled([createListingRecord(carListing()), createListingRecord(carListing({ status: 'draft' }))]);
    const results = [first, second];
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect((rejected as PromiseRejectedResult).reason).toMatchObject({ code: 11_000 });
  });

  it('allows relisting a registration number once the prior listing is archived', async () => {
    const archived = await createListingRecord(carListing({ status: 'archived' }));
    expect(archived.status).toBe('archived');
    const relisted = await createListingRecord(carListing({ status: 'draft' }));
    expect(relisted.status).toBe('draft');
  });
});
