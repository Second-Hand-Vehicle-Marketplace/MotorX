import './env.js';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Real app and MongoDB; Firebase and object storage are replaced (same setup as the other journeys).
const mocks = vi.hoisted(() => ({ verifyIdToken: vi.fn(), getUser: vi.fn(), storageSend: vi.fn() }));
vi.mock('../config/firebase.js', () => ({ firebaseAuth: { verifyIdToken: mocks.verifyIdToken, getUser: mocks.getUser } }));
vi.mock('../config/storage.js', async (importOriginal) => ({ ...(await importOriginal<object>()), storageClient: { send: mocks.storageSend } }));

const { clearTestDb, connectTestDb, disconnectTestDb } = await import('./db.js');
const { app } = await import('../app.js');
const { AuthUserModel } = await import('../modules/auth-users/authUser.model.js');
const { ListingModel } = await import('../modules/marketplace/listing.model.js');
const { clearVerifiedTokenCache } = await import('../shared/middleware/verifyFirebaseToken.js');
const { invalidateHiddenDealerIds } = await import('../modules/marketplace/publicVisibility.js');

type Id = mongoose.Types.ObjectId;
const identities: Record<string, { uid: string; email: string }> = {};
const bearer = (name: string) => ({ Authorization: `Bearer token-${name}` });
async function person(name: string, role: 'buyer' | 'dealer' | 'admin') {
  identities[`token-${name}`] = { uid: `uid-${name}`, email: `${name}@example.com` };
  await request(app).get('/api/v1/auth/me').set(bearer(name));
  return (await AuthUserModel.findOneAndUpdate({ firebaseUid: `uid-${name}` }, { $set: { role } }, { new: true }).lean<{ _id: Id }>())!;
}

const DAY_MS = 24 * 60 * 60 * 1000;
let registration = 0;
type VehicleOverrides = { title?: string; make?: string; model?: string; year?: number; price?: number; category?: string; status?: string; location?: string; lastConfirmedAt?: Date; sourceUploadJobId?: Id; attributes?: Record<string, unknown>; images?: unknown[] };
function vehicle(dealerId: Id, overrides: VehicleOverrides = {}) {
  registration += 1;
  const status = overrides.status ?? 'active';
  return ListingModel.create({
    dealerId, registrationNumber: `CAX-${1000 + registration}`, normalizedRegistrationNumber: `CAX${1000 + registration}`, title: 'Toyota Aqua 2018', make: 'Toyota', model: 'Aqua', year: 2018,
    category: 'car', price: 6_000_000, currency: 'LKR', location: 'Colombo', images: [],
    attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 60_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1_500 },
    publishedAt: status === 'active' ? new Date() : undefined, lastConfirmedAt: status === 'active' ? new Date() : undefined,
    ...overrides, status,
  });
}
const bulk = (name: string, body: object) => request(app).post('/api/v1/listings/mine/bulk').set(bearer(name)).send(body);
const statusOf = async (id: Id) => (await ListingModel.findById(id).lean<{ status: string; price: number; lastConfirmedAt?: Date; publishedAt?: Date }>())!;

describe('dealer listing tools and buyer discovery (HTTP level)', () => {
  beforeAll(async () => { await connectTestDb(); await Promise.all([AuthUserModel.init(), ListingModel.init()]); });
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

  describe('bulk actions', () => {
    it('publishes every chosen draft in one request, and skips listings the action does not apply to', async () => {
      const dealer = await person('dealer', 'dealer');
      const drafts = await Promise.all([vehicle(dealer._id, { status: 'draft' }), vehicle(dealer._id, { status: 'draft' })]);
      const sold = await vehicle(dealer._id, { status: 'sold' });

      const response = await bulk('dealer', { action: 'publish', listingIds: [...drafts.map((d) => String(d._id)), String(sold._id)] });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ action: 'publish', matched: 3, updated: 2, skipped: 1 });
      for (const draft of drafts) {
        const saved = await statusOf(draft._id);
        expect(saved.status).toBe('active');
        expect(saved.publishedAt).toBeInstanceOf(Date);
        expect(saved.lastConfirmedAt).toBeInstanceOf(Date);
      }
      expect((await statusOf(sold._id)).status).toBe('sold');
    });

    it('publishes all drafts from one CSV upload without listing their IDs', async () => {
      const dealer = await person('dealer', 'dealer');
      const uploadJobId = new mongoose.Types.ObjectId();
      await Promise.all([vehicle(dealer._id, { status: 'draft', sourceUploadJobId: uploadJobId }), vehicle(dealer._id, { status: 'draft', sourceUploadJobId: uploadJobId })]);
      const otherDraft = await vehicle(dealer._id, { status: 'draft' });

      const response = await bulk('dealer', { action: 'publish', uploadJobId: String(uploadJobId) });

      expect(response.body.data).toMatchObject({ matched: 2, updated: 2 });
      expect((await statusOf(otherDraft._id)).status).toBe('draft');
    });

    it("never touches another dealer's listings, even when their IDs are sent", async () => {
      const dealer = await person('dealer', 'dealer');
      const rival = await person('rival', 'dealer');
      const theirs = await vehicle(rival._id);

      const response = await bulk('dealer', { action: 'archive', listingIds: [String(theirs._id)] });

      expect(response.body.data).toEqual({ action: 'archive', matched: 0, updated: 0, skipped: 0 });
      expect((await statusOf(theirs._id)).status).toBe('active');
    });

    it('marks sold, archives, and reduces prices by a percentage', async () => {
      const dealer = await person('dealer', 'dealer');
      const [a, b, c] = await Promise.all([vehicle(dealer._id, { price: 6_000_000 }), vehicle(dealer._id, { price: 4_550_000 }), vehicle(dealer._id)]);

      await bulk('dealer', { action: 'reduce-price', listingIds: [String(a._id), String(b._id)], percent: 10 });
      expect((await statusOf(a._id)).price).toBe(5_400_000);
      expect((await statusOf(b._id)).price).toBe(4_095_000);

      await bulk('dealer', { action: 'mark-sold', listingIds: [String(a._id)] });
      await bulk('dealer', { action: 'archive', listingIds: [String(b._id)] });
      expect([(await statusOf(a._id)).status, (await statusOf(b._id)).status, (await statusOf(c._id)).status]).toEqual(['sold', 'archived', 'active']);
    });

    it('deletes only archived listings, and removes their photos and small copies from storage', async () => {
      const dealer = await person('dealer', 'dealer');
      const archived = await vehicle(dealer._id, { status: 'archived', images: [{ key: 'k1.webp', url: 'u', thumbUrl: 't', order: 0 }] });
      const active = await vehicle(dealer._id);

      const response = await bulk('dealer', { action: 'delete', listingIds: [String(archived._id), String(active._id)] });

      expect(response.body.data).toMatchObject({ updated: 1, skipped: 1 });
      expect(await ListingModel.exists({ _id: archived._id })).toBeNull();
      expect(await ListingModel.exists({ _id: active._id })).not.toBeNull();
      const deletedKeys = mocks.storageSend.mock.calls.filter(([command]) => command.constructor.name === 'DeleteObjectCommand').map(([command]) => (command.input as { Key: string }).Key);
      expect(deletedKeys).toEqual(expect.arrayContaining(['listing-images/k1.webp', 'listing-images/thumbs/k1.webp']));
    });

    it('rejects a request mixing chosen IDs with an upload, and a price cut without a percentage', async () => {
      await person('dealer', 'dealer');
      const id = String(new mongoose.Types.ObjectId());
      expect((await bulk('dealer', { action: 'publish', listingIds: [id], uploadJobId: id })).status).toBe(400);
      expect((await bulk('dealer', { action: 'reduce-price', listingIds: [id] })).status).toBe(400);
      expect((await bulk('dealer', { action: 'reduce-price', listingIds: [id], percent: 80 })).status).toBe(400);
    });

    it('is for dealers only', async () => {
      await person('buyer', 'buyer');
      expect((await bulk('buyer', { action: 'publish', listingIds: [String(new mongoose.Types.ObjectId())] })).status).toBe(403);
    });
  });

  describe('stale stock', () => {
    it('counts and lists active listings not confirmed for 60 days, oldest first', async () => {
      const dealer = await person('dealer', 'dealer');
      const old = await vehicle(dealer._id, { lastConfirmedAt: new Date(Date.now() - 90 * DAY_MS) });
      const older = await vehicle(dealer._id, { lastConfirmedAt: new Date(Date.now() - 120 * DAY_MS) });
      await vehicle(dealer._id, { lastConfirmedAt: new Date(Date.now() - 10 * DAY_MS) });
      await vehicle(dealer._id, { status: 'sold', lastConfirmedAt: new Date(Date.now() - 200 * DAY_MS) });

      const stats = await request(app).get('/api/v1/listings/mine/stats').set(bearer('dealer'));
      expect(stats.body.data).toMatchObject({ active: 3, stale: 2, staleAfterDays: 60 });

      const list = await request(app).get('/api/v1/listings/mine').query({ stale: 'true' }).set(bearer('dealer'));
      expect(list.body.data.map((listing: { id: string }) => listing.id)).toEqual([String(older._id), String(old._id)]);
    });

    it('treats listings saved before lastConfirmedAt existed by their last update time', async () => {
      const dealer = await person('dealer', 'dealer');
      const legacy = await vehicle(dealer._id);
      await ListingModel.collection.updateOne({ _id: legacy._id }, { $unset: { lastConfirmedAt: 1 }, $set: { updatedAt: new Date(Date.now() - 70 * DAY_MS) } });

      const stats = await request(app).get('/api/v1/listings/mine/stats').set(bearer('dealer'));

      expect(stats.body.data.stale).toBe(1);
    });

    it('"still available", a price cut, or an edit makes a listing fresh again', async () => {
      const dealer = await person('dealer', 'dealer');
      const long = new Date(Date.now() - 90 * DAY_MS);
      const [confirmed, repriced, edited] = await Promise.all([vehicle(dealer._id, { lastConfirmedAt: long }), vehicle(dealer._id, { lastConfirmedAt: long }), vehicle(dealer._id, { lastConfirmedAt: long })]);

      await bulk('dealer', { action: 'confirm-available', listingIds: [String(confirmed._id)] });
      await bulk('dealer', { action: 'reduce-price', listingIds: [String(repriced._id)], percent: 5 });
      await request(app).patch(`/api/v1/listings/${edited._id}`).set(bearer('dealer')).send({ location: 'Kandy' });

      const stats = await request(app).get('/api/v1/listings/mine/stats').set(bearer('dealer'));
      expect(stats.body.data.stale).toBe(0);
    });
  });

  describe('similar vehicles and recommendations', () => {
    it('ranks the closest vehicles first and never includes the vehicle itself or hidden listings', async () => {
      const dealer = await person('dealer', 'dealer');
      const suspended = await person('suspended', 'dealer');
      const seed = await vehicle(dealer._id);
      const sameModel = await vehicle(dealer._id, { price: 6_200_000, year: 2017 });
      const sameMake = await vehicle(dealer._id, { model: 'Prius', price: 7_000_000 });
      const otherMake = await vehicle(dealer._id, { make: 'Honda', model: 'Fit', price: 5_800_000 });
      await vehicle(dealer._id, { status: 'sold' });
      await vehicle(dealer._id, { category: 'motorcycle', make: 'Bajaj', model: 'Pulsar', price: 600_000, attributes: { condition: 'used', mileageKm: 1_000, fuelType: 'petrol', transmission: 'manual', engineCapacityCc: 150, motorcycleType: 'standard' } });
      await vehicle(suspended._id);
      await AuthUserModel.updateOne({ _id: suspended._id }, { $set: { status: 'suspended' } });

      const response = await request(app).get(`/api/v1/listings/${seed._id}/similar`);

      expect(response.status).toBe(200);
      expect(response.body.data.listings.map((listing: { id: string }) => listing.id)).toEqual([String(sameModel._id), String(sameMake._id), String(otherMake._id)]);
    });

    it('recommends vehicles like the ones this browser viewed, leaving out the viewed ones', async () => {
      const dealer = await person('dealer', 'dealer');
      const viewedA = await vehicle(dealer._id, { make: 'Honda', model: 'Vezel', price: 9_000_000, attributes: { bodyType: 'suv', condition: 'used', mileageKm: 40_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1_500 } });
      const viewedB = await vehicle(dealer._id, { make: 'Honda', model: 'Vezel', price: 9_500_000, attributes: { bodyType: 'suv', condition: 'used', mileageKm: 30_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1_500 } });
      const match = await vehicle(dealer._id, { make: 'Honda', model: 'Vezel', price: 9_200_000, attributes: { bodyType: 'suv', condition: 'used', mileageKm: 35_000, fuelType: 'hybrid', transmission: 'automatic', engineCapacityCc: 1_500 } });
      const weaker = await vehicle(dealer._id, { make: 'Suzuki', model: 'Alto', price: 3_000_000 });

      const response = await request(app).get('/api/v1/listings/recommendations').query({ viewed: `${viewedA._id},${viewedB._id}`, limit: 4 });

      expect(response.status).toBe(200);
      expect(response.body.data.basedOn).toBe(2);
      const ids = response.body.data.listings.map((listing: { id: string }) => listing.id);
      expect(ids[0]).toBe(String(match._id));
      expect(ids).not.toContain(String(viewedA._id));
      expect(ids).toContain(String(weaker._id));
    });

    it('returns nothing (not an error) when no viewed vehicle can be found', async () => {
      const response = await request(app).get('/api/v1/listings/recommendations').query({ viewed: String(new mongoose.Types.ObjectId()) });
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ listings: [], basedOn: 0 });
    });

    it('rejects a malformed viewed list', async () => {
      expect((await request(app).get('/api/v1/listings/recommendations').query({ viewed: 'not-an-id' })).status).toBe(400);
    });
  });

  it('serves the small copy of a photo from the thumbs/ folder', async () => {
    const key = `${new mongoose.Types.ObjectId()}-11111111-2222-3333-4444-555555555555.webp`;
    mocks.storageSend.mockResolvedValue({ Body: (await import('node:stream')).Readable.from([Buffer.from('webp')]), ContentType: 'image/webp' });

    const response = await request(app).get(`/api/v1/listing-images/thumbs/${key}`);

    expect(response.status).toBe(200);
    expect((mocks.storageSend.mock.calls[0]![0].input as { Key: string }).Key).toBe(`listing-images/thumbs/${key}`);
  });
});
