import type { DecodedIdToken } from 'firebase-admin/auth';
import { AuthUserModel } from './authUser.model.js';

export async function findOrCreateAuthUser(identity: DecodedIdToken) {
  const email = identity.email?.trim().toLowerCase();
  if (!email) return null;

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
