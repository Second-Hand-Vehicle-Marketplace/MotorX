import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ countStale: vi.fn(), claim: vi.fn(), notify: vi.fn() }));

vi.mock('../config/env.js', () => ({ env: { STALE_REMINDER_REPEAT_DAYS: 7 } }));
vi.mock('../repositories/listing.repository.js', () => ({ countStaleListingsByDealer: mocks.countStale }));
vi.mock('../repositories/authUser.repository.js', () => ({ claimStaleListingReminder: mocks.claim }));
vi.mock('../services/notification.service.js', () => ({ notifyStaleListings: mocks.notify }));

import { runStaleListingReminders } from './staleListingReminder.job.js';

const now = new Date('2026-09-26T00:00:00Z');

describe('stale listing reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.notify.mockResolvedValue(undefined);
  });

  it('counts listings not confirmed for 60 days, and reminds at most once a week', async () => {
    mocks.countStale.mockResolvedValue([]);

    await runStaleListingReminders(now);

    expect(mocks.countStale).toHaveBeenCalledWith(new Date('2026-07-28T00:00:00Z'), 1_000);
  });

  it('reminds each dealer with their own count, only when this worker wins the claim', async () => {
    const reminded = new Types.ObjectId(); const alreadyReminded = new Types.ObjectId();
    mocks.countStale.mockResolvedValue([{ _id: reminded, count: 12 }, { _id: alreadyReminded, count: 3 }]);
    mocks.claim.mockImplementation(async (dealerId: Types.ObjectId) => dealerId === reminded);

    const result = await runStaleListingReminders(now);

    expect(mocks.claim).toHaveBeenCalledWith(reminded, new Date('2026-09-19T00:00:00Z'), now);
    expect(mocks.notify).toHaveBeenCalledTimes(1);
    expect(mocks.notify).toHaveBeenCalledWith(reminded, 12, 60);
    expect(result).toEqual({ dealersWithStaleStock: 2, reminded: 1 });
  });

  it('keeps going when one dealer fails, so the others are still reminded', async () => {
    const failing = new Types.ObjectId(); const fine = new Types.ObjectId();
    mocks.countStale.mockResolvedValue([{ _id: failing, count: 1 }, { _id: fine, count: 2 }]);
    mocks.claim.mockImplementation(async (dealerId: Types.ObjectId) => { if (dealerId === failing) throw new Error('timeout'); return true; });

    const result = await runStaleListingReminders(now);

    expect(result.reminded).toBe(1);
    expect(mocks.notify).toHaveBeenCalledWith(fine, 2, 60);
  });
});
