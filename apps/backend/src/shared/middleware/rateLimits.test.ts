import '../../test/env.js';
import express from 'express';
import request from 'supertest';
import { MemoryStore, type Store } from 'express-rate-limit';
import { describe, expect, it } from 'vitest';
import { errorHandler } from './errorHandler.js';
import { createLimiter, createUploadConcurrencyGate } from './rateLimits.js';
import { redisClient } from '../../config/redis.js';

// compose.test.yml and CI provide Redis; elsewhere the Redis-backed test is skipped.
const redisAvailable = await redisClient.ping().then(() => true, () => false);

function appWith(...middleware: express.RequestHandler[]) {
  const app = express();
  app.get('/test', ...middleware, (_request, response) => { response.json({ ok: true }); });
  app.use(errorHandler);
  return app;
}

describe('rate limits', () => {
  it('answers 429 in the standard error format once the budget is used up', async () => {
    const app = appWith(createLimiter({ name: 'test', windowMs: 60_000, limit: 2, message: 'Slow down.', store: new MemoryStore() }));

    await request(app).get('/test').expect(200);
    const second = await request(app).get('/test').expect(200);
    const third = await request(app).get('/test').expect(429);

    expect(second.headers.ratelimit).toBeDefined(); // clients can see their remaining budget
    expect(third.body).toEqual({ success: false, error: { code: 'RATE_LIMITED', message: 'Slow down.' }, meta: null });
  });

  it('lets requests through when the shared store (Redis) is down, instead of blocking the site', async () => {
    const brokenStore: Store = {
      increment: async () => { throw new Error('connect ECONNREFUSED'); },
      decrement: async () => undefined,
      resetKey: async () => undefined,
    };
    const app = appWith(createLimiter({ name: 'test', windowMs: 60_000, limit: 1, message: 'Slow down.', store: brokenStore }));

    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
  });

  it('can count only successful requests, so rejected uploads do not use up a quota', async () => {
    let fail = true;
    const app = express();
    app.get('/test', createLimiter({ name: 'quota', windowMs: 60_000, limit: 1, message: 'Quota reached.', countSuccessOnly: true, store: new MemoryStore() }), (_request, response) => {
      response.status(fail ? 400 : 200).json({});
    });
    app.use(errorHandler);

    await request(app).get('/test').expect(400);
    fail = false;
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(429);
  });
});

describe.skipIf(!redisAvailable)('rate limits backed by real Redis', () => {
  it('enforces one shared budget (the default store, as used in production)', async () => {
    const app = appWith(createLimiter({ name: `test-${Date.now()}-${Math.random()}`, windowMs: 60_000, limit: 2, message: 'Slow down.' }));

    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(200);
    await request(app).get('/test').expect(429);
  });
});

describe('upload concurrency gate', () => {
  it('refuses uploads beyond the in-flight maximum with 503 and Retry-After, then admits again', async () => {
    let releaseFirst!: () => void;
    const app = express();
    app.post('/upload', createUploadConcurrencyGate(1), (_request, response) => {
      new Promise<void>((resolve) => { releaseFirst = resolve; }).then(() => response.json({ ok: true }));
    });
    app.use(errorHandler);
    const server = app.listen(0);
    try {
      const first = request(server).post('/upload').then((response) => response);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const refused = await request(server).post('/upload');
      expect(refused.status).toBe(503);
      expect(refused.headers['retry-after']).toBe('10');
      expect(refused.body.error.code).toBe('SERVICE_BUSY');

      releaseFirst();
      expect((await first).status).toBe(200);
      const next = request(server).post('/upload').then((response) => response);
      await new Promise((resolve) => setTimeout(resolve, 50));
      releaseFirst();
      expect((await next).status).toBe(200); // the slot was released
    } finally { server.close(); }
  });
});
