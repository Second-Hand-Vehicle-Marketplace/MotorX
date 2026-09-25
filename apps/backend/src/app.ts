import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { inventoryQueue } from './config/queue.js';
import { logger } from './config/logger.js';
import { authUserRouter } from './modules/auth-users/authUser.routes.js';
import { listingImageRouter, listingRouter } from './modules/marketplace/index.js';
import { dealerRouter } from './modules/dealers/index.js';
import { adminRouter } from './modules/admin/index.js';
import { buyerRouter } from './modules/buyers/index.js';
import { inventoryRouter } from './modules/inventory/index.js';
import { notificationRouter } from './modules/notifications/index.js';
import { searchRouter } from './modules/search/index.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { sendSuccess } from './shared/responses/apiResponse.js';
import { env } from './config/env.js';
import { apiLimiter } from './shared/middleware/rateLimits.js';

export const app = express();

const configuredCorsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:4173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedCorsOrigins = process.env.NODE_ENV === 'production'
  ? configuredCorsOrigins
  : [...new Set([...configuredCorsOrigins, 'http://localhost:8080', 'http://localhost:5173'])];

// The frontend and backend are intentionally different origins (separate SPA + API deployment,
// e.g. localhost:8080 vs localhost:3000 in dev). Helmet's default same-origin resource policy
// blocks the browser from rendering anything the backend serves — most visibly, every <img>
// pointed at /api/v1/listing-images — so it's relaxed here to match how this app is actually deployed.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((request, response, next) => {
  const startedAt = Date.now();
  response.on('finish', () => logger.info({ method: request.method, path: request.path, statusCode: response.statusCode, durationMs: Date.now() - startedAt }, 'HTTP request completed'));
  next();
});
app.use(
  cors({
    origin: allowedCorsOrigins,
  }),
);
app.use(express.json());
app.disable('x-powered-by');
// Behind the AWS load balancer the client IP arrives in X-Forwarded-For; trust exactly that many
// proxies so rate limits apply per real client (0 locally, where there is no proxy).
app.set('trust proxy', env.TRUST_PROXY_HOPS);
// Health checks stay outside the limiter so load balancer probes are never throttled.
app.use('/api', apiLimiter);

app.get('/health/live', (_request, response) => {
  sendSuccess(response, { service: 'backend', status: 'UP' });
});

// Resolves false instead of waiting when a dependency does not answer quickly: a hung Redis or
// MongoDB must never make the health endpoint itself hang.
async function checkWithin(check: () => Promise<unknown>, timeoutMs: number): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([check(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), timeoutMs); })]);
    return true;
  } catch { return false; } finally { clearTimeout(timer); }
}

// Readiness decides whether the load balancer sends traffic here. It depends on MongoDB only:
// almost every request needs the database, but only uploads need Redis. Every instance shares the
// same Redis, so failing readiness on a Redis outage would take the whole site down instead of
// just delaying uploads (which stay pending and are queued once Redis returns).
// Liveness (/health/live) is what the orchestrator restarts on; it never checks dependencies.
app.get('/health/ready', async (_request, response) => {
  const [databaseReady, redisReady] = await Promise.all([
    checkWithin(async () => { if (mongoose.connection.readyState !== 1) throw new Error('disconnected'); await mongoose.connection.db!.admin().ping(); }, 1_000),
    checkWithin(async () => { const client = await inventoryQueue.client; await client.info(); }, 1_000),
  ]);
  if (!databaseReady) response.status(503);
  sendSuccess(response, {
    service: 'backend',
    status: !databaseReady ? 'NOT_READY' : redisReady ? 'READY' : 'DEGRADED',
    dependencies: { database: databaseReady ? 'ready' : 'unavailable', redis: redisReady ? 'ready' : 'unavailable' },
  });
});

app.use('/api/v1/auth', authUserRouter);
// listingRouter must mount before buyerRouter: buyerRouter's public GET /:listingId
// would otherwise shadow listingRouter's GET /mine (matching "mine" as a listing id).
app.use('/api/v1/listings', listingRouter);
app.use('/api/v1/listings', buyerRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/listing-images', listingImageRouter);
app.use('/api/v1/dealers', dealerRouter);
app.use('/api/v1/dealer/uploads', inventoryRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use(errorHandler);
