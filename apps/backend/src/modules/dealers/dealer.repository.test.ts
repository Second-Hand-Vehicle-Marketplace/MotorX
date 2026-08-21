import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDb, connectTestDb, disconnectTestDb } from '../../test/db.js';
import { createDealer, findDealerByUserId } from './dealer.repository.js';

describe('dealer repository', () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  const application = (businessName: string, registrationNumber: string, phone: string, address: string) => ({
    businessName, registrationNumber, phone, address,
    representativeName: 'Test Representative', city: 'Colombo', province: 'Western',
    businessPhone: phone, businessEmail: `${registrationNumber.toLowerCase()}@example.com`,
    dealershipType: 'used' as const, brands: ['Toyota'],
    description: 'A test dealership application used by the backend repository suite.',
    verificationDocuments: [],
  });

  it('creates a pending dealer application and finds it by user id', async () => {
    const userId = new mongoose.Types.ObjectId();

    await createDealer(userId, application('Colombo Motors', 'reg-001', '0770000000', '123 Galle Road, Colombo'));

    const found = await findDealerByUserId(userId);

    expect(found?.businessName).toBe('Colombo Motors');
    expect(found?.registrationNumber).toBe('REG-001');
    expect(found?.status).toBe('pending');
  });

});
