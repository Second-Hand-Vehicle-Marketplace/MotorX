import mongoose, { type Types } from 'mongoose';

export interface WorkerAuthUser { email: string; displayName?: string; role: string }

const authUserSchema = new mongoose.Schema<WorkerAuthUser>({
  email: { type: String, required: true }, displayName: String, role: { type: String, required: true },
}, { collection: 'authusers', versionKey: false, strict: false });
const AuthUserModel = mongoose.models.WorkerAuthUser ?? mongoose.model<WorkerAuthUser>('WorkerAuthUser', authUserSchema);

// Looks up the dealer's contact details for the completion email. auth-users is backend-owned;
// the worker's only write is the stale-stock reminder marker below.
export function findAuthUserById(userId: Types.ObjectId) {
  return AuthUserModel.findById(userId).select('email displayName').lean() as Promise<{ email: string; displayName?: string } | null>;
}

// Fans admin-only advisory notifications (high rejection rate) out to every active administrator.
export async function findAdminUserIds(): Promise<Types.ObjectId[]> {
  const admins = await AuthUserModel.find({ role: 'admin' }).select('_id').lean();
  return admins.map((admin) => admin._id as Types.ObjectId);
}

// Records that a dealer is being reminded about stale stock, but only if they were not reminded
// since `notRemindedSince`. Atomic, so two worker copies running the same cycle never both send
// the reminder: only the one whose update matched goes on to notify. (staleReminderSentAt is the
// one field the worker writes here; the backend model ignores it.)
export async function claimStaleListingReminder(dealerUserId: Types.ObjectId, notRemindedSince: Date, now: Date): Promise<boolean> {
  const result = await AuthUserModel.updateOne(
    { _id: dealerUserId, role: 'dealer', status: { $ne: 'suspended' }, $or: [{ staleReminderSentAt: { $exists: false } }, { staleReminderSentAt: { $lt: notRemindedSince } }] },
    { $set: { staleReminderSentAt: now } },
  );
  return result.modifiedCount === 1;
}
