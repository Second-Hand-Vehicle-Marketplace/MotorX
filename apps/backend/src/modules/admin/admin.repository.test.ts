import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDb, connectTestDb, disconnectTestDb } from '../../test/db.js';
import { DealerModel } from '../dealers/dealer.model.js';
import { listPendingDealerApplications } from './admin.repository.js';

describe('admin repository', () => {
  beforeAll(connectTestDb); afterEach(clearTestDb); afterAll(disconnectTestDb);

  it('lists pending dealer applications oldest first', async () => {
    const base = { phone: '0110000001', address: 'Address', representativeName: 'Representative', city: 'Colombo', province: 'Western', businessPhone: '0110000001', businessEmail: 'dealer@example.com', dealershipType: 'used' as const, brands: [], description: 'Test dealer application.', verificationDocuments: [] };
    await DealerModel.create({ ...base, userId: new mongoose.Types.ObjectId(), businessName: 'A Motors', registrationNumber: 'REG-A', businessEmail: 'a@example.com' });
    await DealerModel.create({ ...base, userId: new mongoose.Types.ObjectId(), businessName: 'B Motors', registrationNumber: 'REG-B', businessEmail: 'b@example.com' });
    const pending = await listPendingDealerApplications();
    expect(pending.map((dealer) => dealer.businessName)).toEqual(['A Motors', 'B Motors']);
  });
});
