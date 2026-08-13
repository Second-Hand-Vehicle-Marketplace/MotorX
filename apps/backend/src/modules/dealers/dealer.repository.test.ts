import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDb, connectTestDb, disconnectTestDb } from '../../test/db.js';
import { createDealer, findDealerByUserId, listDealersByStatus } from './dealer.repository.js';

describe('dealer repository', () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it('creates a pending dealer application and finds it by user id', async () => {
    const userId = new mongoose.Types.ObjectId();

    await createDealer(userId, {
      businessName: 'Colombo Motors',
      registrationNumber: 'reg-001',
      phone: '0770000000',
      address: '123 Galle Road, Colombo',
    });

    const found = await findDealerByUserId(userId);

    expect(found?.businessName).toBe('Colombo Motors');
    expect(found?.registrationNumber).toBe('REG-001');
    expect(found?.status).toBe('pending');
  });

  it('lists applications filtered by status, oldest first', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    await createDealer(userA, { businessName: 'A Motors', registrationNumber: 'REG-A', phone: '0110000001', address: 'Address A' });
    await createDealer(userB, { businessName: 'B Motors', registrationNumber: 'REG-B', phone: '0110000002', address: 'Address B' });

    const pending = await listDealersByStatus('pending');

    expect(pending.map((dealer) => dealer.businessName)).toEqual(['A Motors', 'B Motors']);
  });
});
