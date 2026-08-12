import { Schema, model, models, type HydratedDocument } from 'mongoose';

export const userRoles = ['buyer', 'dealer', 'admin'] as const;
export const userStatuses = ['active', 'pending', 'suspended'] as const;
export type UserRole = (typeof userRoles)[number];
export type UserStatus = (typeof userStatuses)[number];

export interface AuthUser {
  firebaseUid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date;
}

export type AuthUserDocument = HydratedDocument<AuthUser>;

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
