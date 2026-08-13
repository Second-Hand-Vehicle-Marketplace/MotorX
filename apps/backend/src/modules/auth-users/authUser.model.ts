import mongoose, { type HydratedDocument } from 'mongoose';
import { userRoles, userStatuses, type UserRole, type UserStatus } from '@motorx/shared-contracts';

export type { UserRole, UserStatus };

export interface AuthUser {
  firebaseUid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date;
}

export type AuthUserDocument = HydratedDocument<AuthUser>;

const { Schema, model, models } = mongoose;

const authUserSchema = new Schema<AuthUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, immutable: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    displayName: { type: String, trim: true, maxlength: 120 },
    role: { type: String, enum: userRoles, required: true, default: 'buyer' },
    status: { type: String, enum: userStatuses, required: true, default: 'active' },
    lastLoginAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

export const AuthUserModel =
  models.AuthUser ?? model<AuthUser>('AuthUser', authUserSchema);
