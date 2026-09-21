import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: false, unique: true, sparse: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['buyer', 'dealer', 'admin'], required: true, default: 'buyer' },
    dealerStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], required: false },
    businessName: { type: String, required: false, trim: true },
    businessLicense: { type: String, required: false, trim: true },
    phone: { type: String, required: false, trim: true },
    address: { type: String, required: false, trim: true },
    isActive: { type: Boolean, required: true, default: true },
    createdAt: { type: Date, required: true, default: Date.now },
    lastLoginAt: { type: Date, required: true, default: Date.now },
  },
  {
    versionKey: false,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>('User', userSchema);