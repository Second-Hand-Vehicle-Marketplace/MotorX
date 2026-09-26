import { createHash } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { env } from '../../config/env.js';
import { firebaseAuth } from '../../config/firebase.js';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';
import type { AuthenticatedRequest } from '../types/authenticatedRequest.js';

// Verified tokens, keyed by a hash of the token (the raw token is never kept as a key). Checking
// revocation means a network call to Firebase, so each token is fully verified at most once per
// AUTH_TOKEN_CACHE_TTL_MS instead of on every request. A revoked token (e.g. after a password
// change) therefore stops working within that TTL; account suspension is enforced separately on
// every request from the local user record. Entries never outlive the token's own expiry.
const MAX_CACHED_TOKENS = 10_000;
const verifiedTokens = new Map<string, { identity: DecodedIdToken; trustedUntil: number }>();

function cacheKey(token: string) { return createHash('sha256').update(token).digest('base64url'); }

export function clearVerifiedTokenCache() { verifiedTokens.clear(); }

async function verifyWithCache(token: string): Promise<DecodedIdToken> {
  const key = cacheKey(token);
  const now = Date.now();
  const cached = verifiedTokens.get(key);
  if (cached && cached.trustedUntil > now) return cached.identity;
  if (cached) verifiedTokens.delete(key);

  const identity = await firebaseAuth.verifyIdToken(token, true);
  const trustedUntil = Math.min(now + env.AUTH_TOKEN_CACHE_TTL_MS, identity.exp * 1_000);
  if (trustedUntil > now) {
    // Map keeps insertion order, so the first key is the oldest entry.
    if (verifiedTokens.size >= MAX_CACHED_TOKENS) verifiedTokens.delete(verifiedTokens.keys().next().value!);
    verifiedTokens.set(key, { identity, trustedUntil });
  }
  return identity;
}

// Verifies the bearer token and attaches its Firebase identity to the request.
export async function verifyFirebaseToken(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = request.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return next(new AppError(401, errorCodes.unauthorized, 'A Firebase ID token is required.'));

  try {
    request.firebaseUser = await verifyWithCache(match[1]!);
    next();
  } catch {
    next(new AppError(401, errorCodes.unauthorized, 'The Firebase ID token is invalid, expired, or revoked.'));
  }
}
