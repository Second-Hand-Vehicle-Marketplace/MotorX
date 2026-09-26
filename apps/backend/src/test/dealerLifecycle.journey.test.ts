import './env.js';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Real app and MongoDB; Firebase and object storage are replaced (same setup as accessControl.journey).
const mocks = vi.hoisted(() => ({ verifyIdToken: vi.fn(), getUser: vi.fn(), storageSend: vi.fn() }));
vi.mock('../config/firebase.js', () => ({ firebaseAuth: { verifyIdToken: mocks.verifyIdToken, getUser: mocks.getUser } }));
vi.mock('../config/storage.js', async (importOriginal) => ({ ...(await importOriginal<object>()), storageClient: { send: mocks.storageSend } }));

const { clearTestDb, connectTestDb, disconnectTestDb } = await import('./db.js');
const { app } = await import('../app.js');
const { AuthUserModel } = await import('../modules/auth-users/authUser.model.js');
const { ListingModel } = await import('../modules/marketplace/listing.model.js');
const { DealerModel } = await import('../modules/dealers/dealer.model.js');
const { UploadJobModel } = await import('../modules/inventory/uploadJob.model.js');
const { AdminAuditLogModel } = await import('../modules/admin/admin.model.js');
const { clearVerifiedTokenCache } = await import('../shared/middleware/verifyFirebaseToken.js');
const { invalidateHiddenDealerIds } = await import('../modules/marketplace/publicVisibility.js');

const identities: Record<string, { uid: string; email: string }> = {};
const bearer = (name: string) => ({ Authorization: `Bearer token-${name}` });
async function person(name: string, role: 'buyer' | 'dealer' | 'admin') {
  identities[`token-${name}`] = { uid: `uid-${name}`, email: `${name}@example.com` };
  await request(app).get('/api/v1/auth/me').set(bearer(name));
  return (await AuthUserModel.findOneAndUpdate({ firebaseUid: `uid-${name}` }, { $set: { role } }, { new: true }).lean<{ _id: mongoose.Types.ObjectId }>())!;
}

const businessDetails = {
  businessName: 'Lanka Motors', registrationNumber: 'REG-LM-1', phone: '0112345678', address: '12 Galle Road, Colombo', representativeName: 'Nimal Perera',
  city: 'Colombo', province: 'Western', businessPhone: '0112345679', businessEmail: 'sales@lankamotors.lk', dealershipType: 'used' as const,
  brands: ['Toyota'], description: 'Family-run used car dealership in Colombo since 2005.',
};
const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n', 'latin1');
const sentStorageKeys = (commandName: string) => mocks.storageSend.mock.calls.filter(([command]) => command.constructor.name === commandName).map(([command]) => (command.input as { Key: string }).Key);

function applicationRequest(name: string, overrides: Record<string, string> = {}) {
  const fields: Record<string, string> = { ...businessDetails, brands: 'Toyota', ...overrides } as Record<string, string>;
  let call = request(app).post('/api/v1/dealers/applications').set(bearer(name));
  for (const [key, value] of Object.entries(fields)) call = call.field(key, value);
  return call.attach('businessRegistration', pdf, { filename: 'br.pdf', contentType: 'application/pdf' }).attach('identityProof', pdf, { filename: 'id.pdf', contentType: 'application/pdf' });
}

describe('dealer lifecycle (HTTP level)', () => {
  beforeAll(async () => { await connectTestDb(); await Promise.all([AuthUserModel.init(), ListingModel.init(), DealerModel.init(), UploadJobModel.init()]); });
  afterAll(disconnectTestDb);
  afterEach(clearTestDb);
  beforeEach(() => {
    vi.clearAllMocks();
    clearVerifiedTokenCache();
    invalidateHiddenDealerIds();
    mocks.verifyIdToken.mockImplementation(async (token: string) => {
      const identity = identities[token];
      if (!identity) throw new Error('auth/argument-error');
      return { ...identity, email_verified: true, exp: Math.floor(Date.now() / 1000) + 3_600 };
    });
    mocks.storageSend.mockResolvedValue({});
  });

  describe('suspended dealers disappear from public pages', () => {
    async function publishedListing(dealerId: mongoose.Types.ObjectId) {
      return ListingModel.create({
        dealerId, registrationNumber: 'CAX-9876', normalizedRegistrationNumber: 'CAX9876', title: 'Toyota Aqua 2018', make: 'Toyota', model: 'Aqua', year: 2018,
        category: 'car', price: 6_000_000, currency: 'LKR', location: 'Colombo', status: 'active', publishedAt: new Date(), images: [],
        attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 60_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1_500 },
      });
    }

    it('hides the listing from browse, detail, and search while suspended, and shows it again after reactivation', async () => {
      const dealer = await person('dealer', 'dealer');
      await person('admin', 'admin');
      const listing = await publishedListing(dealer._id);
      const visibleIn = async () => ({
        browse: JSON.stringify((await request(app).get('/api/v1/listings')).body).includes(String(listing._id)),
        detail: (await request(app).get(`/api/v1/listings/${listing._id}`)).status === 200,
        search: JSON.stringify((await request(app).get('/api/v1/search').query({ q: 'Toyota Aqua' })).body).includes(String(listing._id)),
      });

      expect(await visibleIn()).toEqual({ browse: true, detail: true, search: true });

      await request(app).patch(`/api/v1/admin/users/${dealer._id}`).set(bearer('admin')).send({ status: 'suspended' }).expect(200);
      expect(await visibleIn()).toEqual({ browse: false, detail: false, search: false });

      await request(app).patch(`/api/v1/admin/users/${dealer._id}`).set(bearer('admin')).send({ status: 'active' }).expect(200);
      expect(await visibleIn()).toEqual({ browse: true, detail: true, search: true });
    });
  });

  describe('dealer profile editing', () => {
    it('lets an approved dealer update contact details but not the verified business name or registration number', async () => {
      const dealer = await person('dealer', 'dealer');
      await DealerModel.create({ ...businessDetails, userId: dealer._id, status: 'approved', website: 'https://old.example.com', verificationDocuments: [] });

      const response = await request(app).patch('/api/v1/dealers/me/profile').set(bearer('dealer'))
        .send({ businessPhone: '0779998888', city: 'Kandy', website: '', businessName: 'Renamed Motors', registrationNumber: 'FAKE-1' }).expect(200);

      expect(response.body.data).toMatchObject({ businessPhone: '0779998888', city: 'Kandy', website: null, businessName: 'Lanka Motors', registrationNumber: 'REG-LM-1' });
      expect(await DealerModel.findOne({ userId: dealer._id }).lean()).toMatchObject({ businessName: 'Lanka Motors', registrationNumber: 'REG-LM-1', city: 'Kandy' });
    });

    it('validates changes and is only available to approved dealers', async () => {
      await person('dealer', 'dealer');
      await person('buyer', 'buyer');
      await request(app).patch('/api/v1/dealers/me/profile').set(bearer('dealer')).send({ businessEmail: 'not-an-email' }).expect(400);
      await request(app).patch('/api/v1/dealers/me/profile').set(bearer('dealer')).send({}).expect(400);
      await request(app).patch('/api/v1/dealers/me/profile').set(bearer('dealer')).send({ city: 'Kandy' }).expect(404); // no approved profile
      await request(app).patch('/api/v1/dealers/me/profile').set(bearer('buyer')).send({ city: 'Kandy' }).expect(403);
    });
  });

  describe('applying from an existing account and resubmitting after rejection', () => {
    it('lets a signed-in buyer apply without creating a new account', async () => {
      const buyer = await person('buyer', 'buyer');
      const response = await applicationRequest('buyer').expect(201);
      expect(response.body.data).toMatchObject({ userId: String(buyer._id), status: 'pending', reviewHistory: [] });
      await applicationRequest('buyer').expect(409); // already waiting for review
    });

    it('lets a rejected applicant correct and resubmit, keeping the earlier decision and replacing the old documents', async () => {
      const applicant = await person('applicant', 'buyer');
      const admin = await person('admin', 'admin');
      await applicationRequest('applicant').expect(201);
      const first = await DealerModel.findOne({ userId: applicant._id }).lean();
      const oldKeys = first!.verificationDocuments.map((document) => document.key);
      await request(app).patch(`/api/v1/admin/dealer-applications/${first!._id}/reject`).set(bearer('admin')).send({ reason: 'Registration certificate is unreadable.' }).expect(200);
      mocks.storageSend.mockClear();

      const resubmitted = await applicationRequest('applicant', { description: 'Family-run used car dealership in Colombo since 2005. New certificate attached.' }).expect(201);

      expect(resubmitted.body.data).toMatchObject({ id: String(first!._id), status: 'pending', rejectionReason: null, reviewedAt: null });
      expect(resubmitted.body.data.reviewHistory).toEqual([expect.objectContaining({ status: 'rejected', reason: 'Registration certificate is unreadable.' })]);
      const stored = await DealerModel.findOne({ userId: applicant._id }).lean();
      expect(stored!.reviewHistory[0]).toMatchObject({ reviewedBy: admin._id });
      expect(stored!.verificationDocuments.map((document) => document.key)).not.toEqual(oldKeys);
      expect(sentStorageKeys('DeleteObjectCommand')).toEqual(expect.arrayContaining(oldKeys)); // old files removed
      expect(await DealerModel.countDocuments({ userId: applicant._id })).toBe(1);
    });

    it('does not let an approved dealer submit another application', async () => {
      const dealer = await person('dealer', 'buyer');
      await DealerModel.create({ ...businessDetails, userId: dealer._id, status: 'approved', verificationDocuments: [] });
      await applicationRequest('dealer', { registrationNumber: 'REG-OTHER' }).expect(409);
    });
  });

  describe('admin monitoring filters', () => {
    it('opens one exact upload and filters uploads and audit events by date', async () => {
      const admin = await person('admin', 'admin');
      const dealer = await person('dealer', 'dealer');
      const upload = (fileName: string, createdAt: string) => ({ dealerId: dealer._id, fileName, fileSize: 1, storageKey: `k/${fileName}`, category: 'car', status: 'completed', createdAt: new Date(createdAt) });
      // Written straight to the collections so the chosen createdAt dates are kept exactly.
      const uploads = await UploadJobModel.collection.insertMany([upload('august.csv', '2026-08-15T10:00:00Z'), upload('september.csv', '2026-09-20T10:00:00Z')]);
      await AdminAuditLogModel.collection.insertMany([
        { eventType: 'user_suspended', actorId: admin._id, targetId: dealer._id, targetName: 'x', details: 'a', createdAt: new Date('2026-08-15T10:00:00Z') },
        { eventType: 'user_activated', actorId: admin._id, targetId: dealer._id, targetName: 'x', details: 'b', createdAt: new Date('2026-09-20T23:59:00Z') },
      ]);

      const exact = await request(app).get('/api/v1/admin/uploads').query({ uploadId: String(uploads.insertedIds[1]) }).set(bearer('admin')).expect(200);
      expect(exact.body.data.map((item: { fileName: string }) => item.fileName)).toEqual(['september.csv']);

      const inSeptember = await request(app).get('/api/v1/admin/uploads').query({ from: '2026-09-01', to: '2026-09-30' }).set(bearer('admin')).expect(200);
      expect(inSeptember.body.data.map((item: { fileName: string }) => item.fileName)).toEqual(['september.csv']);

      const lastDayInclusive = await request(app).get('/api/v1/admin/audit-logs').query({ from: '2026-09-20', to: '2026-09-20' }).set(bearer('admin')).expect(200);
      expect(lastDayInclusive.body.data.map((item: { details: string }) => item.details)).toEqual(['b']);

      await request(app).get('/api/v1/admin/uploads').query({ from: '20-09-2026' }).set(bearer('admin')).expect(400);
    });
  });
});
