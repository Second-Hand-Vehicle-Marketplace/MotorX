import './env.js';
import mongoose from 'mongoose';
import request from 'supertest';
import sharp from 'sharp';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase and object storage are replaced; everything else (routing, middleware, services,
// MongoDB queries) is the real application talking to the disposable test database.
const mocks = vi.hoisted(() => ({ verifyIdToken: vi.fn(), getUser: vi.fn(), storageSend: vi.fn() }));
vi.mock('../config/firebase.js', () => ({ firebaseAuth: { verifyIdToken: mocks.verifyIdToken, getUser: mocks.getUser } }));
vi.mock('../config/storage.js', async (importOriginal) => ({ ...(await importOriginal<object>()), storageClient: { send: mocks.storageSend } }));

const { clearTestDb, connectTestDb, disconnectTestDb } = await import('./db.js');
const { app } = await import('../app.js');
const { AuthUserModel } = await import('../modules/auth-users/authUser.model.js');
const { ListingModel } = await import('../modules/marketplace/listing.model.js');
const { UploadJobModel } = await import('../modules/inventory/uploadJob.model.js');
const { DealerModel } = await import('../modules/dealers/dealer.model.js');
const { clearVerifiedTokenCache } = await import('../shared/middleware/verifyFirebaseToken.js');

type Role = 'buyer' | 'dealer' | 'admin';
const identities: Record<string, { uid: string; email: string }> = {};
const bearer = (name: string) => ({ Authorization: `Bearer token-${name}` });

// Creates a signed-in person: Firebase accepts their token, and their local account has this role.
async function person(name: string, role: Role) {
  identities[`token-${name}`] = { uid: `uid-${name}`, email: `${name}@example.com` };
  await request(app).get('/api/v1/auth/me').set(bearer(name)); // first request creates the local user
  return AuthUserModel.findOneAndUpdate({ firebaseUid: `uid-${name}` }, { $set: { role } }, { new: true }).lean<{ _id: mongoose.Types.ObjectId }>();
}

async function listingFor(dealerId: mongoose.Types.ObjectId) {
  const id = new mongoose.Types.ObjectId();
  return ListingModel.create({
    _id: id, dealerId, registrationNumber: 'CAX-1234', normalizedRegistrationNumber: 'CAX1234', title: 'Toyota Corolla 2020', make: 'Toyota', model: 'Corolla',
    year: 2020, category: 'car', price: 8_500_000, currency: 'LKR', location: 'Colombo', status: 'draft',
    attributes: { bodyType: 'sedan', condition: 'used', mileageKm: 45_000, fuelType: 'petrol', transmission: 'automatic', engineCapacityCc: 1_800 },
    images: [{ key: `${id}-11111111-2222-3333-4444-555555555555.webp`, url: 'http://localhost/x.webp', order: 0 }],
  });
}

describe('access control across dealers, roles, and admin actions (HTTP level, no browser)', () => {
  let dealerA: { _id: mongoose.Types.ObjectId };
  let listingA: Awaited<ReturnType<typeof listingFor>>;
  let uploadA: { _id: mongoose.Types.ObjectId };
  let applicationA: { _id: mongoose.Types.ObjectId };

  beforeAll(async () => {
    await connectTestDb();
    await Promise.all([AuthUserModel.init(), ListingModel.init(), UploadJobModel.init(), DealerModel.init()]);
  });
  afterAll(disconnectTestDb);
  afterEach(clearTestDb);

  beforeEach(async () => {
    vi.clearAllMocks();
    clearVerifiedTokenCache();
    mocks.verifyIdToken.mockImplementation(async (token: string) => {
      const identity = identities[token];
      if (!identity) throw new Error('auth/argument-error');
      return { ...identity, email_verified: true, exp: Math.floor(Date.now() / 1000) + 3_600 };
    });
    mocks.storageSend.mockResolvedValue({});

    dealerA = (await person('dealer-a', 'dealer'))!;
    await person('dealer-b', 'dealer');
    await person('buyer', 'buyer');
    await person('admin', 'admin');
    listingA = await listingFor(dealerA._id);
    uploadA = await UploadJobModel.create({ dealerId: dealerA._id, fileName: 'stock.csv', fileSize: 100, storageKey: 'inventory/a/stock.csv', category: 'car', status: 'failed', failureReason: 'x' });
    applicationA = await DealerModel.create({
      userId: dealerA._id, businessName: 'A Motors', registrationNumber: 'REG-A', phone: '0110000001', address: 'Address', representativeName: 'Rep', city: 'Colombo', province: 'Western',
      businessPhone: '0110000001', businessEmail: 'a@example.com', dealershipType: 'used', brands: [], description: 'Dealer A.', status: 'approved',
      verificationDocuments: [{ category: 'identityProof', key: 'dealer-verification/a/id.pdf', originalName: 'id.pdf', contentType: 'application/pdf', size: 10 }],
    });
  });

  describe("dealer B cannot reach dealer A's data by changing IDs", () => {
    const asB = bearer('dealer-b');

    it('cannot view, edit, change status of, or delete the listing', async () => {
      const id = String(listingA._id);
      await request(app).get(`/api/v1/listings/mine/${id}`).set(asB).expect(404);
      await request(app).patch(`/api/v1/listings/${id}`).set(asB).send({ price: 1 }).expect(404);
      await request(app).patch(`/api/v1/listings/${id}/status`).set(asB).send({ status: 'archived' }).expect(404);
      await request(app).delete(`/api/v1/listings/${id}`).set(asB).expect(404);

      expect(await ListingModel.findById(id).lean()).toMatchObject({ price: 8_500_000, status: 'draft' });
    });

    it("cannot add, delete, or reorder the listing's photos", async () => {
      const id = String(listingA._id);
      const key = listingA.images[0]!.key;
      const png = await sharp({ create: { width: 700, height: 420, channels: 3, background: '#888' } }).png().toBuffer();

      await request(app).post(`/api/v1/listings/${id}/images`).set(asB).attach('image', png, { filename: 'x.png', contentType: 'image/png' }).expect(404);
      await request(app).delete(`/api/v1/listings/${id}/images/${key}`).set(asB).expect(404);
      await request(app).patch(`/api/v1/listings/${id}/images/reorder`).set(asB).send({ imageKeys: [key] }).expect(404);

      expect((await ListingModel.findById(id).lean<{ images: Array<{ key: string }> }>())!.images.map((image) => image.key)).toEqual([key]);
      expect(mocks.storageSend).not.toHaveBeenCalled(); // nothing was uploaded or deleted in storage
    });

    it('cannot see, retry, or attach photos to the upload', async () => {
      const id = String(uploadA._id);
      await request(app).get(`/api/v1/dealer/uploads/${id}`).set(asB).expect(404);
      await request(app).get(`/api/v1/dealer/uploads/${id}/rejected-records`).set(asB).expect(404);
      await request(app).post(`/api/v1/dealer/uploads/${id}/retry`).set(asB).expect(409);

      expect(await UploadJobModel.findById(id).lean()).toMatchObject({ status: 'failed' });
    });

    it('does not get the listing or upload in their own lists', async () => {
      const listings = await request(app).get('/api/v1/listings/mine').set(asB).expect(200);
      const uploads = await request(app).get('/api/v1/dealer/uploads').set(asB).expect(200);

      expect(JSON.stringify(listings.body)).not.toContain(String(listingA._id));
      expect(JSON.stringify(uploads.body)).not.toContain(String(uploadA._id));
    });

    it("cannot open the dealer's verification documents", async () => {
      await request(app).get(`/api/v1/admin/dealer-applications/${applicationA._id}/documents/0`).set(asB).expect(403);
      const mine = await request(app).get('/api/v1/dealers/me').set(asB);
      expect(mine.status).toBe(404); // B has no application; A's is never returned
    });
  });

  describe('public and role boundaries', () => {
    it("does not show a dealer's draft listing publicly", async () => {
      await request(app).get(`/api/v1/listings/${listingA._id}`).expect(404);
      await request(app).get(`/api/v1/listings/${listingA._id}`).set(bearer('buyer')).expect(404);
    });

    it('refuses to serve private storage objects through the public image route', async () => {
      await request(app).get('/api/v1/listing-images/dealer-verification%2Fa%2Fid.pdf').expect(400);
      await request(app).get('/api/v1/listing-images/inventory%2Fa%2Fstock.csv').expect(400);
      expect(mocks.storageSend).not.toHaveBeenCalled();
    });

    it('requires sign-in, and the right role, for dealer and admin areas', async () => {
      await request(app).get('/api/v1/listings/mine').expect(401);
      await request(app).get('/api/v1/listings/mine').set({ Authorization: 'Bearer forged-token' }).expect(401);
      await request(app).get('/api/v1/listings/mine').set(bearer('buyer')).expect(403);
      await request(app).get('/api/v1/dealer/uploads').set(bearer('buyer')).expect(403);
      await request(app).get('/api/v1/admin/users').set(bearer('dealer-a')).expect(403);
      await request(app).get('/api/v1/admin/users').set(bearer('admin')).expect(200);
    });

    it('blocks a suspended account even with a valid token', async () => {
      await AuthUserModel.updateOne({ firebaseUid: 'uid-dealer-a' }, { $set: { status: 'suspended' } });
      await request(app).get('/api/v1/listings/mine').set(bearer('dealer-a')).expect(403);
    });
  });

  describe('dealer approval requires a verified email', () => {
    it('refuses approval until the applicant has verified their email, then approves', async () => {
      const applicant = await person('applicant', 'buyer');
      const application = await DealerModel.create({
        userId: applicant!._id, businessName: 'C Motors', registrationNumber: 'REG-C', phone: '0110000003', address: 'Address', representativeName: 'Rep', city: 'Kandy', province: 'Central',
        businessPhone: '0110000003', businessEmail: 'c@example.com', dealershipType: 'used', brands: [], description: 'Dealer C.', verificationDocuments: [],
      });

      mocks.getUser.mockResolvedValue({ emailVerified: false });
      const refused = await request(app).patch(`/api/v1/admin/dealer-applications/${application._id}/approve`).set(bearer('admin')).expect(409);
      expect(refused.body.error.message).toContain('not verified their email');
      expect(await AuthUserModel.findById(applicant!._id).lean()).toMatchObject({ role: 'buyer' });

      mocks.getUser.mockResolvedValue({ emailVerified: true });
      await request(app).patch(`/api/v1/admin/dealer-applications/${application._id}/approve`).set(bearer('admin')).expect(200);
      expect(await AuthUserModel.findById(applicant!._id).lean()).toMatchObject({ role: 'dealer' });
      expect(mocks.getUser).toHaveBeenCalledWith('uid-applicant');
    });
  });
});
