import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { normalizeRegistrationNumber, type CarAttributes } from '@motorx/shared-contracts';
import { clearTestDb, connectTestDb, disconnectTestDb } from '../../test/db.js';
import { createListingRecord, findActiveListingByRegistration } from './listing.repository.js';
import type { Listing } from './listing.model.js';

describe('listing repository — registration duplicate detection', () => {
  beforeAll(connectTestDb);
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
});
