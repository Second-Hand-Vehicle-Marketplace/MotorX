import mongoose, { type Types } from 'mongoose';

export interface WorkerAuthUser { email: string; displayName?: string; role: string }

const authUserSchema = new mongoose.Schema<WorkerAuthUser>({
  email: { type: String, required: true }, displayName: String, role: { type: String, required: true },
}, { collection: 'authusers', versionKey: false, strict: false });
const AuthUserModel = mongoose.models.WorkerAuthUser ?? mongoose.model<WorkerAuthUser>('WorkerAuthUser', authUserSchema);

// Looks up the dealer's contact details for the completion email — the worker only ever reads
// this collection, never writes it (auth-users remains backend-owned).
export function findAuthUserById(userId: Types.ObjectId) {
  return AuthUserModel.findById(userId).select('email displayName').lean() as Promise<{ email: string; displayName?: string } | null>;
}

// Fans admin-only advisory notifications (high rejection rate) out to every active administrator.
export async function findAdminUserIds(): Promise<Types.ObjectId[]> {
  const admins = await AuthUserModel.find({ role: 'admin' }).select('_id').lean();
  return admins.map((admin) => admin._id as Types.ObjectId);
}
