import { STALE_LISTING_DAYS } from '@motorx/shared-contracts';
import { env } from '../config/env.js';
import { claimStaleListingReminder } from '../repositories/authUser.repository.js';
import { countStaleListingsByDealer } from '../repositories/listing.repository.js';
import { notifyStaleListings } from '../services/notification.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DEALERS_PER_CYCLE = 1_000;

// Tells each dealer how many of their published listings have not been confirmed for
// STALE_LISTING_DAYS days, at most once every STALE_REMINDER_REPEAT_DAYS days. Safe to run on
// several worker copies at once: the per-dealer claim lets only one of them send the reminder.
export async function runStaleListingReminders(now = new Date()) {
  const cutoff = new Date(now.getTime() - STALE_LISTING_DAYS * DAY_MS);
  const notRemindedSince = new Date(now.getTime() - env.STALE_REMINDER_REPEAT_DAYS * DAY_MS);
  const dealers = await countStaleListingsByDealer(cutoff, MAX_DEALERS_PER_CYCLE);
  let reminded = 0;
  for (const dealer of dealers) {
    try {
      if (!(await claimStaleListingReminder(dealer._id, notRemindedSince, now))) continue;
      await notifyStaleListings(dealer._id, dealer.count, STALE_LISTING_DAYS);
      reminded += 1;
    } catch (error) {
      console.error('Stale listing reminder failed; will retry next cycle.', { dealerId: String(dealer._id), message: error instanceof Error ? error.message : String(error) });
    }
  }
  if (reminded) console.log('Stale listing reminders sent.', { reminded, dealersWithStaleStock: dealers.length });
  return { dealersWithStaleStock: dealers.length, reminded };
}
