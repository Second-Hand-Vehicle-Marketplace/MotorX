import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ipKeyGenerator, rateLimit, type Options, type Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { redisClient } from '../../config/redis.js';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';
import type { AuthenticatedRequest } from '../types/authenticatedRequest.js';

const MINUTE = 60_000;

// Counters live in Redis so every backend instance enforces one shared budget.
function redisStore(prefix: string): Store {
  return new RedisStore({ prefix: `rl:${prefix}:`, sendCommand: (command: string, ...args: string[]) => redisClient.call(command, ...args) as never });
}

// The authenticated user when known (per-account limits), otherwise the client IP (IPv6 addresses
// are grouped by /56 subnet so one host cannot dodge the limit by rotating addresses).
function userOrIpKey(request: Request) {
  const user = (request as AuthenticatedRequest).localUser;
  return user ? `user:${String(user._id)}` : `ip:${ipKeyGenerator(request.ip ?? 'unknown')}`;
}

interface LimiterConfig { name: string; windowMs: number; limit: number; message: string; code?: string; byUser?: boolean; countSuccessOnly?: boolean; store?: Store }

// Builds one limiter. On a Redis outage the limiter lets requests through (and logs), because
// blocking every request would turn a Redis problem into a full outage.
export function createLimiter({ name, windowMs, limit, message, code = errorCodes.rateLimited, byUser = false, countSuccessOnly = false, store }: LimiterConfig): RequestHandler {
  const options: Partial<Options> = {
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    passOnStoreError: true,
    // Quotas count only accepted uploads, so a rejected file does not use up the allowance.
    skipFailedRequests: countSuccessOnly,
    store: store ?? redisStore(name),
    keyGenerator: byUser ? userOrIpKey : (request) => ipKeyGenerator(request.ip ?? 'unknown'),
    handler: (_request, _response, next) => next(new AppError(429, code, message)),
  };
  return rateLimit(options);
}

let storeErrorLogged = 0;
redisClient.on('error', () => {
  // Log a Redis outage for the limiters at most once a minute instead of on every request.
  if (Date.now() - storeErrorLogged > MINUTE) { storeErrorLogged = Date.now(); logger.warn('Rate limits are not enforced while Redis is unreachable.'); }
});

// Every API request, per client IP.
export const apiLimiter = createLimiter({ name: 'api', windowMs: MINUTE, limit: env.RATE_LIMIT_API_PER_MINUTE, message: 'Too many requests. Please wait a moment and try again.' });

// Search may call an external embedding service, so it gets a tighter budget.
export const searchLimiter = createLimiter({ name: 'search', windowMs: MINUTE, limit: env.RATE_LIMIT_SEARCH_PER_MINUTE, message: 'Too many searches. Please wait a moment and try again.' });

// Mounted after authentication, so these count per dealer account.
export const uploadBurstLimiter = createLimiter({ name: 'upload', windowMs: 10 * MINUTE, limit: env.RATE_LIMIT_UPLOADS_PER_10_MINUTES, byUser: true, message: 'Too many uploads in a short time. Please wait a few minutes and try again.' });
export const csvDailyQuota = createLimiter({ name: 'quota-csv', windowMs: 24 * 60 * MINUTE, limit: env.QUOTA_CSV_UPLOADS_PER_DAY, byUser: true, countSuccessOnly: true, code: errorCodes.quotaExceeded, message: `The daily limit of ${env.QUOTA_CSV_UPLOADS_PER_DAY} CSV uploads has been reached. Try again tomorrow.` });
export const photoZipDailyQuota = createLimiter({ name: 'quota-zip', windowMs: 24 * 60 * MINUTE, limit: env.QUOTA_PHOTO_ZIPS_PER_DAY, byUser: true, countSuccessOnly: true, code: errorCodes.quotaExceeded, message: `The daily limit of ${env.QUOTA_PHOTO_ZIPS_PER_DAY} photo uploads has been reached. Try again tomorrow.` });
// Listing photos arrive one request per photo, so they get their own, larger budget.
export const listingPhotoLimiter = createLimiter({ name: 'listing-photo', windowMs: 10 * MINUTE, limit: env.RATE_LIMIT_LISTING_PHOTOS_PER_10_MINUTES, byUser: true, message: 'Too many photo uploads in a short time. Please wait a few minutes and try again.' });
export const dealerApplicationLimiter = createLimiter({ name: 'dealer-application', windowMs: 60 * MINUTE, limit: env.RATE_LIMIT_DEALER_APPLICATIONS_PER_HOUR, byUser: true, message: 'Too many application attempts. Please try again later.' });

// Caps how many file uploads this instance buffers in memory at once. Runs before the body is
// read, so an extra upload is refused immediately (503 + Retry-After) instead of using memory.
export function createUploadConcurrencyGate(maximum: number): RequestHandler {
  let active = 0;
  return (_request: Request, response: Response, next: NextFunction) => {
    if (active >= maximum) {
      response.setHeader('Retry-After', '10');
      next(new AppError(503, errorCodes.busy, 'The server is busy processing other uploads. Please try again in a few seconds.'));
      return;
    }
    active += 1;
    let released = false;
    const release = () => { if (!released) { released = true; active -= 1; } };
    response.on('finish', release);
    response.on('close', release);
    next();
  };
}

export const uploadConcurrencyGate = createUploadConcurrencyGate(env.MAX_CONCURRENT_UPLOADS);
