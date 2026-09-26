import { isStringArray, readStored, removeStored, writeStored } from '@/shared/utils/safeStorage';

// Vehicles this browser opened recently, newest first. Used only to ask the server for
// "Recommended for you"; it never leaves the device except as that request's list of IDs.
const STORAGE_KEY = 'motorx.recentlyViewed';
export const MAX_RECENTLY_VIEWED = 12;

export function getRecentlyViewed(): string[] {
  return readStored(STORAGE_KEY, [], isStringArray).slice(0, MAX_RECENTLY_VIEWED);
}

export function recordRecentlyViewed(listingId: string) {
  writeStored(STORAGE_KEY, [listingId, ...getRecentlyViewed().filter((id) => id !== listingId)].slice(0, MAX_RECENTLY_VIEWED));
}

export function clearRecentlyViewed() {
  removeStored(STORAGE_KEY);
}
