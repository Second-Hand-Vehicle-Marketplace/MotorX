## Fix 5 pre-launch reliability/security issues (Step 10)
# Context
Before MotorX goes to public deployment, Step 10 of the deployment checklist calls out six problems. The lockfile item is already resolved (confirmed: package-lock.json is committed, and all four Dockerfiles plus CI already use npm ci). The remaining five are real, reachable bugs — confirmed by reading the actual code, not assumed from the checklist text:

ZIP extraction and the duplicate-listing race are the two with real exploitability/data-integrity risk if shipped as-is (a crafted ZIP can still fully inflate an oversized entry into memory before rejection; concurrent requests can create two active listings for the same vehicle).
Health checks currently lie: Docker's backend healthcheck hits /health/live, which is hardcoded to always return UP, so docker compose will report and route to a backend even when MongoDB is unreachable — this is also why docker compose up failed earlier in this session (backend depended on Atlas being reachable, and the failure mode was opaque).
Worker stuck-job recovery is broken in a subtle way: a 5-minute Mongo "lease" is supposed to reclaim jobs abandoned by a crashed worker, but BullMQ exhausts its 3 retry attempts in ~14 seconds, so retries hit the still-live lease, throw immediately, and never actually mark anything failed or retried — the job is stuck in Mongo forever with nothing left to reclaim it.
Description clearing is a straightforward but user-facing bug: setting description: null builds a MongoDB update that both $sets and $unsets the same field, which Mongo rejects outright (error 40), so dealers can never clear a listing's description.
Recommended sequencing below is by implementation dependency (independent/trivial fixes first, the schema-changing one last since it needs a pre-deploy duplicate-data check). For deployment sequencing: ZIP limits, health checks, and the duplicate constraint are the ones I'd block public launch on; the worker reaper and description-clear fixes are lower-risk to land as a fast-follow within the first days post-launch if monitored — but all five are scoped and ready to implement now.

# 1. Description null-clear conflict (trivial, independent)
File: apps/backend/src/modules/marketplace/listing.service.ts

In the Object.entries(input) loop (~lines 77-80), value === null currently falls through into update.description = null, which then collides with the $unset: { description: 1 } that unsetDescription triggers downstream — Mongo rejects $set+$unset on the same path.

Fix: skip description in the $set loop when it's null (the existing $unset path already handles clearing it), mirroring the existing value === undefined guard:

for (const [key, value] of Object.entries(input)) {
  if (key === 'attributes' || value === undefined) continue;
  if (key === 'description' && value === null) continue; // cleared via $unset below
  update[key] = value;
}
No other changes — unsetDescription and updateOwnedListing's $unset handling are already correct once update.description stops being set alongside it.

Verify: PATCH a listing with { description: null } → expect 200, and a follow-up GET confirms the field is actually cleared (currently this request fails outright).

# 2. ZIP extraction isn't actually bomb-safe
File: apps/worker/src/services/imageProcessing.service.ts, extractImageEntries

Current code checks entry.vars.uncompressedSize before calling await entry.buffer() — but that field doesn't even exist on unzipper's File type (dead check), and regardless, entry.buffer() fully inflates the entry into memory before the real buffer.length limit is enforced. A crafted entry with an extreme compression ratio still gets fully decompressed before rejection.

Fix: consume the entry as a stream and enforce the byte cap while reading, destroying the stream the instant the cap is exceeded instead of buffering first:

function readEntryWithinLimit(entry: unzipper.File, limitBytes: number): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const stream = entry.stream();
    const chunks: Buffer[] = [];
    let total = 0;
    let overLimit = false;
    stream.on('data', (chunk: Buffer) => {
      if (overLimit) return;
      total += chunk.length;
      if (total > limitBytes) { overLimit = true; stream.destroy(); resolve(null); return; }
      chunks.push(chunk);
    });
    stream.on('close', () => { if (!overLimit) resolve(Buffer.concat(chunks)); });
    stream.on('error', reject);
  });
}
In extractImageEntries, drop the unreliable pre-check and replace the buffering call:

const remainingBudget = workerStorageConfig.maxZipExpandedBytes - expandedBytes;
const perEntryLimit = Math.max(0, Math.min(workerStorageConfig.maxImageBytes, remainingBudget));
const buffer = await readEntryWithinLimit(entry, perEntryLimit);
if (buffer === null) throw new Error('The vehicle photos archive exceeds its expanded size limit.');
expandedBytes += buffer.length;
Keep the existing entry-count check (maxZipEntries) as-is — that part is fine.

Verify: add a test that feeds a high-compression-ratio entry (or a stubbed stream emitting more bytes than maxImageBytes) and asserts extraction rejects it without ever accumulating the full inflated payload.

# 3. Health checks report healthy when they aren't
Files: compose.yml, apps/backend/src/app.ts, apps/backend/src/modules/admin/admin.service.ts + admin.controller.ts, new apps/worker/src/health.ts, apps/worker/src/worker.ts, apps/worker/src/config/env.ts.

a) Point compose's backend healthcheck at the endpoint that actually checks dependencies. Today it hits /health/live (hardcoded UP); it should hit /health/ready (checks Mongo, and after this change, Redis too). Leave /health/live itself alone — a dependency-free liveness probe is correct to keep.

# compose.yml backend service healthcheck
test: [ "CMD", "node", "-e", "fetch('http://localhost:3000/health/ready').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" ]
b) Add a Redis check to /health/ready (apps/backend/src/app.ts), reusing the existing inventoryQueue connection rather than opening a new one:

app.get('/health/ready', async (_request, response) => {
  const databaseReady = mongoose.connection.readyState === 1;
  let redisReady = false;
  try { const client = await inventoryQueue.client; redisReady = (await client.ping()) === 'PONG'; } catch { redisReady = false; }
  const ready = databaseReady && redisReady;
  if (!ready) response.status(503);
  sendSuccess(response, { service: 'backend', status: ready ? 'READY' : 'NOT_READY', dependencies: { database: databaseReady ? 'ready' : 'unavailable', redis: redisReady ? 'ready' : 'unavailable' } });
});
c) Give the worker a minimal health endpoint — it has none today, and compose's worker service has no healthcheck: at all. No express dependency exists in apps/worker, so use Node's built-in http (kept intentionally minimal). New apps/worker/src/health.ts:

import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { redisConnection } from './config/redis.js';
import { env } from './config/env.js';

export function startWorkerHealthServer() {
  const server = createServer((req, res) => {
    if (req.url !== '/health') { res.writeHead(404); res.end(); return; }
    const mongoReady = mongoose.connection.readyState === 1;
    const redisReady = redisConnection.status === 'ready';
    const ok = mongoReady && redisReady;
    res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: ok ? 'READY' : 'NOT_READY', mongo: mongoReady, redis: redisReady }));
  });
  server.listen(env.WORKER_HEALTH_PORT);
  return server;
}
Add WORKER_HEALTH_PORT (default 3100) to apps/worker/src/config/env.ts. Start it in startWorker() (apps/worker/src/worker.ts) alongside the reaper from item 4, and close it in shutdown(). Add to compose.yml's worker service:

healthcheck:
  test: [ "CMD", "node", "-e", "fetch('http://localhost:3100/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" ]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 20s
d) Fix the admin system-health dashboard, which currently hardcodes queue/worker to 'not_configured'. Queue status is straightforward (reuse inventoryQueue.getJobCounts(...)); worker liveness can't be observed directly from the backend process (separate container, no shared port), so approximate it via a heartbeat timestamp the worker writes on the same interval as its reaper cycle (item 4):

// admin.service.ts
export async function getSystemHealthForAdmin() {
  const ready = mongoose.connection.readyState === 1;
  let queueStatus: { status: string; counts?: Record<string, number> };
  try { queueStatus = { status: 'operational', counts: await inventoryQueue.getJobCounts('active', 'waiting', 'delayed', 'failed') }; }
  catch { queueStatus = { status: 'unavailable' }; }
  const heartbeat = await mongoose.connection.db?.collection('workerHeartbeats').findOne({ _id: 'worker' });
  const freshWindowMs = 2 * env.JOB_REAPER_INTERVAL_MS_EQUIVALENT; // 2x the worker's heartbeat interval, kept in sync via shared constant/env
  const workerAlive = !!heartbeat && Date.now() - new Date(heartbeat.lastSeenAt).getTime() < freshWindowMs;
  return {
    checkedAt: new Date().toISOString(),
    backend: { status: 'operational', uptimeSeconds: Math.floor(process.uptime()) },
    database: { status: ready ? 'operational' : 'unavailable', readyState: mongoose.connection.readyState },
    queue: queueStatus,
    worker: { status: workerAlive ? 'operational' : 'unavailable', lastSeenAt: heartbeat?.lastSeenAt ?? null },
  };
}
Note in a code comment that worker status is a proxy (last-write timestamp), not a true per-process liveness check — acceptable given how small the win of a fuller signal would be. Update admin.controller.ts to await the now-async function.

Verify: stop Redis locally → /health/ready returns 503 with redis: 'unavailable', /health/live still 200. docker compose ps shows the worker flipping to unhealthy when Redis/Mongo are killed. Admin GET /api/v1/admin/system-health shows real queue counts and worker.status going stale after the worker is stopped.

# 4. Worker stuck-job recovery
Files: apps/worker/src/services/uploadJob.service.ts, apps/worker/src/services/imageProcessing.service.ts, apps/worker/src/repositories/uploadJob.repository.ts, new apps/worker/src/config/queue.ts, new apps/worker/src/jobs/reaper.job.ts, apps/worker/src/worker.ts, apps/worker/src/config/env.ts.

Approach: rather than trying to tune the 5-minute Mongo lease and BullMQ's ~14s retry budget to match each other (fragile — a legitimately slow job could still outlive a shortened lease), decouple recovery from BullMQ's own retries entirely and make the Mongo lease the sole source of truth.

a) Stop burning a BullMQ attempt on a claim-miss. Today, when claimPendingUploadJob/claimPendingImageProcessing return null (lease still held, job not stale yet), the service throws immediately — wasting one of only 3 BullMQ attempts on a no-op, without ever touching Mongo. Change this to a graceful skip:

// uploadJob.service.ts, extractInventoryUpload
const upload = await claimPendingUploadJob(uploadJobId);
if (!upload) {
  console.warn('Upload job claim missed; already claimed, terminal, or lease still active.', { uploadJobId });
  return { uploadJobId, stage: 'skipped' as const };
}
Mirror in imageProcessing.service.ts's processInventoryImages.

b) Add a lease-reaper as the actual recovery mechanism, driven only by leaseExpiresAt. New apps/worker/src/config/queue.ts (mirrors the backend's producer pattern, reusing the worker's existing Redis connection):

import { Queue } from 'bullmq';
import { env } from './env.js';
import { redisConnection } from './redis.js';

export const inventoryQueueProducer = new Queue(env.INVENTORY_QUEUE_NAME, { connection: redisConnection });
New repository queries in uploadJob.repository.ts:

export function findExpiredLeaseUploadJobs(now = new Date()) {
  return UploadJobModel.find({ status: 'processing', leaseExpiresAt: { $lt: now } }).select('_id attemptCount').lean();
}
export function findExpiredLeaseImageJobs(now = new Date()) {
  return UploadJobModel.find({ imageProcessingStatus: 'processing', leaseExpiresAt: { $lt: now } }).select('_id attemptCount').lean();
}
New apps/worker/src/jobs/reaper.job.ts:

import { inventoryQueueProducer } from '../config/queue.js';
import { env } from '../config/env.js';
import { failImageProcessing, failUploadJob, findExpiredLeaseImageJobs, findExpiredLeaseUploadJobs } from '../repositories/uploadJob.repository.js';
import { upsertWorkerHeartbeat } from '../repositories/workerHeartbeat.repository.js';

async function reclaim(id: string, jobName: 'process-inventory' | 'process-inventory-images', bullJobId: string) {
  const existing = await inventoryQueueProducer.getJob(bullJobId);
  if (existing) {
    try { await existing.remove(); }
    catch { return; } // still genuinely active in BullMQ — skip this cycle rather than double-process
  }
  await inventoryQueueProducer.add(jobName, { uploadJobId: id }, { jobId: bullJobId });
}

export async function runLeaseReaper() {
  await upsertWorkerHeartbeat();
  const [expiredUploads, expiredImages] = await Promise.all([findExpiredLeaseUploadJobs(), findExpiredLeaseImageJobs()]);
  for (const job of expiredUploads) {
    const id = String(job._id);
    if (job.attemptCount >= env.JOB_MAX_RECLAIM_ATTEMPTS) { await failUploadJob(id, 'Exceeded maximum reclaim attempts after repeated lease expirations.'); continue; }
    await reclaim(id, 'process-inventory', id);
  }
  for (const job of expiredImages) {
    const id = String(job._id);
    if (job.attemptCount >= env.JOB_MAX_RECLAIM_ATTEMPTS) { await failImageProcessing(id, 'Exceeded maximum reclaim attempts after repeated lease expirations.'); continue; }
    await reclaim(id, 'process-inventory-images', `${id}-images`);
  }
}
upsertWorkerHeartbeat (new, small repository function) writes the same heartbeat doc that item 3(d)'s admin dashboard reads — one timer serves both purposes, no second interval needed.

Add JOB_REAPER_INTERVAL_MS (default 60_000) and JOB_MAX_RECLAIM_ATTEMPTS (default 5) to apps/worker/src/config/env.ts. Wire into startWorker() in worker.ts, alongside the health server from item 3(c):

const reaperTimer = setInterval(() => { void runLeaseReaper().catch((error) => console.error('Lease reaper cycle failed.', error)); }, env.JOB_REAPER_INTERVAL_MS);
// in shutdown(): clearInterval(reaperTimer);
c) Note on re-enqueueing: BullMQ dedups add() calls by jobId, and this codebase always reuses a deterministic jobId (the Mongo uploadJobId, or ${uploadJobId}-images). Re-adding with the same ID after the prior job already resolved would otherwise silently no-op — the reaper's explicit existing.remove() before re-adding is what makes the retry actually restart processing.

No change needed to the backend's defaultJobOptions (attempts: 3) — those attempts remain meaningful for genuine transient errors (the existing retryable regex in the catch blocks), since they're no longer wasted on claim-misses.

Verify: set an UploadJobModel doc to status: 'processing' with an expired leaseExpiresAt; run runLeaseReaper(); confirm a fresh BullMQ job is enqueued under the same jobId and the stale one is removed first. Confirm a doc at attemptCount >= JOB_MAX_RECLAIM_ATTEMPTS gets marked failed instead of re-enqueued. Manual/e2e: docker compose kill worker mid-job, restart it, confirm the stuck Mongo doc eventually resolves instead of staying processing forever.

# 5. Duplicate listing race — DB-level constraint
Files: apps/backend/src/modules/marketplace/listing.model.ts, apps/backend/src/modules/marketplace/listing.service.ts.

Replace the existing non-unique index (same key, so it's a replacement not an addition) with a partial unique index scoped to non-terminal statuses, so archived/sold vehicles can still legitimately be relisted:

// listing.model.ts — replaces the current index() call
listingSchema.index(
  { normalizedRegistrationNumber: 1 },
  { name: 'normalizedRegistrationNumber_unique_active', unique: true, partialFilterExpression: { status: { $in: ['draft', 'active'] } } },
);
Deployment note — do before applying this migration in any environment with existing data: run a duplicate check first (aggregate {status: {$in:['draft','active']}} listings grouped by normalizedRegistrationNumber, filter count > 1) and resolve any conflicts, or index creation will fail. No tooling needed beyond a one-off query — flagging so it isn't missed at deploy time.

Catch the resulting duplicate-key error at the two racy call sites, mirroring the existing pattern already used in apps/backend/src/modules/dealers/dealer.service.ts:37-40:

// listing.service.ts, createDealerListing
try {
  const document = await createListingRecord({ ...input, normalizedRegistrationNumber, dealerId, /* ...existing fields */ });
  return serializeListing(document.toObject() as ListingRecord);
} catch (error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)
    throw new AppError(409, errorCodes.conflict, 'A currently listed vehicle already uses this registration number.');
  throw error;
}
Apply the same try/catch around the reactivation path in changeDealerListingStatus when nextStatus === 'active'. Keep assertRegistrationNotActivelyListed as-is in both places — it's still a useful cheap early rejection for the common non-racing case; the index is the backstop for the race itself.

Verify: fire two concurrent createDealerListing calls with the same registration number (Promise.allSettled) — expect exactly one success and one 409. Confirm archived → relist still works (create, archive, create a new draft with the same registration number should succeed, proving the partial filter is correct).

Suggested implementation order
Description null-clear (trivial, isolated)
ZIP extraction streaming fix (isolated)
Health checks (backend /health/ready + Redis, worker health endpoint, admin dashboard)
Worker stuck-job reaper (builds on the worker heartbeat introduced in step 3)
Duplicate listing partial unique index (last — needs the pre-migration duplicate-data check)