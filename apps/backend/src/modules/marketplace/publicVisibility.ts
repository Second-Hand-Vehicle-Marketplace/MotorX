import type { Types } from 'mongoose';
import { AuthUserModel } from '../auth-users/authUser.model.js';

// A listing is public only while it is active AND its dealer's account is active. Suspended
// dealers are few, so their ids are looked up once and reused for a short time instead of on
// every browse/search request. Suspending or reactivating clears this instance's copy at once;
// other backend instances pick up the change within CACHE_MS.
const CACHE_MS = 15_000;
let cached: { ids: Types.ObjectId[]; until: number } | undefined;

export async function getHiddenDealerIds(): Promise<Types.ObjectId[]> {
  if (cached && cached.until > Date.now()) return cached.ids;
  const suspended = await AuthUserModel.find({ status: 'suspended' }).select('_id').lean();
  cached = { ids: suspended.map((user) => user._id as Types.ObjectId), until: Date.now() + CACHE_MS };
  return cached.ids;
}

export function invalidateHiddenDealerIds() { cached = undefined; }

// Filter fragment for listing queries: excludes listings of suspended dealers.
export async function publicDealerFilter(): Promise<Record<string, unknown>> {
  const hidden = await getHiddenDealerIds();
  return hidden.length ? { dealerId: { $nin: hidden } } : {};
}
