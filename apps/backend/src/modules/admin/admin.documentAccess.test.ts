import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearTestDb, connectTestDb, disconnectTestDb } from '../../test/db.js';
import { DealerModel } from '../dealers/dealer.model.js';
import { AdminAuditLogModel } from './admin.model.js';

// admin.service.ts transitively loads config/env.ts, which validates the full backend env at
// import time. Stub harmless values (only if unset) and import the service afterwards.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/unused';
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
const { getDealerDocumentForAdmin } = await import('./admin.service.js');

const adminId = new mongoose.Types.ObjectId();
const applicantId = new mongoose.Types.ObjectId();
const application = {
  userId: applicantId, businessName: 'Lanka Motors', registrationNumber: 'REG-DOC-1', phone: '0110000001', address: 'Address',
  representativeName: 'Representative', city: 'Colombo', province: 'Western', businessPhone: '0110000001', businessEmail: 'dealer@example.com',
  dealershipType: 'used' as const, brands: [], description: 'Test dealer application.',
  verificationDocuments: [{ category: 'identityProof' as const, key: 'dealer-verification/u1/id.pdf', originalName: 'national-id.pdf', contentType: 'application/pdf', size: 1234 }],
};

describe('admin access to dealer verification documents', () => {
  beforeAll(connectTestDb); afterEach(clearTestDb); afterAll(disconnectTestDb);

  it('records who viewed which document in the audit log', async () => {
    const dealer = await DealerModel.create(application);

    const document = await getDealerDocumentForAdmin(dealer.id, 0, adminId);

    expect(document.key).toBe('dealer-verification/u1/id.pdf');
    const logs = await AdminAuditLogModel.find({ eventType: 'dealer_document_viewed' }).lean();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ actorId: adminId, targetId: applicantId, targetName: 'Lanka Motors', details: 'Viewed identityProof document "national-id.pdf".' });
  });

  it('answers 410 Gone once documents were deleted by the retention policy, without logging a view', async () => {
    const dealer = await DealerModel.create({ ...application, verificationDocuments: [], documentsDeletedAt: new Date('2026-09-01T00:00:00Z') });

    await expect(getDealerDocumentForAdmin(dealer.id, 0, adminId)).rejects.toMatchObject({ statusCode: 410, message: expect.stringContaining('2026-09-01') });
    expect(await AdminAuditLogModel.countDocuments()).toBe(0);
  });

  it('does not log a view for a document index that does not exist', async () => {
    const dealer = await DealerModel.create(application);

    await expect(getDealerDocumentForAdmin(dealer.id, 5, adminId)).rejects.toMatchObject({ statusCode: 404 });
    expect(await AdminAuditLogModel.countDocuments()).toBe(0);
  });
});
