import type { DecodedIdToken } from 'firebase-admin/auth';
import { AuthUserModel } from './authUser.model.js';

// lastLoginAt is activity information, not security state: refreshing it at most this often keeps
// every authenticated request from also being a database write.
const LAST_LOGIN_REFRESH_MS = 15 * 60_000;

// Synchronizes a verified Firebase identity with its local MotorX user. Reads on every request
// (role and suspension status must always be current) but writes only when the account is new,
// its email or name changed, or lastLoginAt is older than LAST_LOGIN_REFRESH_MS.
export async function findOrCreateAuthUser(identity: DecodedIdToken) {
  const email = identity.email?.trim().toLowerCase();
  if (!email) return null;

  const existing = await AuthUserModel.findOne({ firebaseUid: identity.uid });
  if (existing) {
    const changed = existing.email !== email || (identity.name !== undefined && identity.name !== existing.displayName);
    const stale = Date.now() - new Date(existing.lastLoginAt).getTime() > LAST_LOGIN_REFRESH_MS;
    if (!changed && !stale) return existing;
  }

  return AuthUserModel.findOneAndUpdate(
    { firebaseUid: identity.uid },
    {
      $set: {
        email,
        ...(identity.name ? { displayName: identity.name } : {}),
        lastLoginAt: new Date(),
      },
      $setOnInsert: { role: 'buyer', status: 'active' },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
}
