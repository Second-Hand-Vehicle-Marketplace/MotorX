import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/uploadJob.repository.js', () => ({ JOB_LEASE_MS: 120_000 }));

import { holdLease, LeaseLostError } from './jobLease.js';

describe('holdLease', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(console, 'warn').mockImplementation(() => undefined); });
  afterEach(() => { vi.useRealTimers(); });

  it('renews the lease every third of its duration while work continues', async () => {
    const renew = vi.fn().mockResolvedValue(true);
    const lease = holdLease('job-1', 'owner-1', renew);

    await vi.advanceTimersByTimeAsync(120_000);

    expect(renew).toHaveBeenCalledTimes(3);
    expect(renew).toHaveBeenCalledWith('job-1', 'owner-1');
    expect(() => lease.assertHeld()).not.toThrow();
    lease.stop();
  });

  it('reports the lease as lost once another worker owns the job', async () => {
    const lease = holdLease('job-1', 'owner-1', vi.fn().mockResolvedValue(false));

    await vi.advanceTimersByTimeAsync(40_000);

    expect(() => lease.assertHeld()).toThrow(LeaseLostError);
    lease.stop();
  });

  it('keeps the lease through a temporary renewal error and tries again next time', async () => {
    const renew = vi.fn().mockRejectedValueOnce(new Error('network blip')).mockResolvedValue(true);
    const lease = holdLease('job-1', 'owner-1', renew);

    await vi.advanceTimersByTimeAsync(80_000);

    expect(renew).toHaveBeenCalledTimes(2);
    expect(() => lease.assertHeld()).not.toThrow();
    lease.stop();
  });

  it('stops renewing when the job ends', async () => {
    const renew = vi.fn().mockResolvedValue(true);
    holdLease('job-1', 'owner-1', renew).stop();

    await vi.advanceTimersByTimeAsync(120_000);

    expect(renew).not.toHaveBeenCalled();
  });
});
