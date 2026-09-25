import '../../test/env.js';
import type { NextFunction } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyIdToken = vi.hoisted(() => vi.fn());
vi.mock('../../config/firebase.js', () => ({ firebaseAuth: { verifyIdToken } }));

import { clearVerifiedTokenCache, verifyFirebaseToken } from './verifyFirebaseToken.js';
import type { AuthenticatedRequest } from '../types/authenticatedRequest.js';

const inOneHour = () => Math.floor(Date.now() / 1000) + 3_600;
async function authenticate(token: string) {
  const request = { headers: { authorization: `Bearer ${token}` } } as AuthenticatedRequest;
  const next = vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
  await verifyFirebaseToken(request, {} as never, next);
  return { request, error: next.mock.calls[0]?.[0] };
}

describe('verifyFirebaseToken', () => {
  beforeEach(() => { vi.clearAllMocks(); clearVerifiedTokenCache(); vi.useRealTimers(); });

  it('checks a token (including revocation) with Firebase once, then reuses the result', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', exp: inOneHour() });

    const first = await authenticate('token-a');
    const second = await authenticate('token-a');

    expect(first.request.firebaseUser?.uid).toBe('u1');
    expect(second.request.firebaseUser?.uid).toBe('u1');
    expect(verifyIdToken).toHaveBeenCalledTimes(1);
    expect(verifyIdToken).toHaveBeenCalledWith('token-a', true);
  });

  it('checks with Firebase again after the cache period, so a revoked token stops working', async () => {
    vi.useFakeTimers();
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1', exp: inOneHour() }).mockRejectedValueOnce(new Error('auth/id-token-revoked'));

    await authenticate('token-a');
    vi.advanceTimersByTime(120_001);
    const { error } = await authenticate('token-a');

    expect(verifyIdToken).toHaveBeenCalledTimes(2);
    expect(error).toMatchObject({ statusCode: 401 });
  });

  it('never trusts a cached token beyond its own expiry', async () => {
    vi.useFakeTimers();
    verifyIdToken.mockResolvedValueOnce({ uid: 'u1', exp: Math.floor(Date.now() / 1000) + 30 }).mockRejectedValueOnce(new Error('auth/id-token-expired'));

    await authenticate('token-a');
    vi.advanceTimersByTime(31_000);
    const { error } = await authenticate('token-a');

    expect(error).toMatchObject({ statusCode: 401 });
  });

  it('rejects requests without a bearer token and does not cache failures', async () => {
    verifyIdToken.mockRejectedValue(new Error('invalid'));

    expect((await authenticate('bad')).error).toMatchObject({ statusCode: 401 });
    expect((await authenticate('bad')).error).toMatchObject({ statusCode: 401 });
    expect(verifyIdToken).toHaveBeenCalledTimes(2);
  });
});
