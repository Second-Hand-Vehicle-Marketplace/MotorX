import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const dealerApplicationSchema = new Schema(
  {
    firebaseUid: { type: String, required: false, unique: true, sparse: true, trim: true },
    applicantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    businessLicense: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], required: true, default: 'pending' },
    appliedAt: { type: Date, required: true, default: Date.now },
    reviewedAt: { type: Date, required: false },
    reviewNotes: { type: String, required: false, trim: true },
  },
  {
    versionKey: false,
  },
);

export type DealerApplicationDocument = InferSchemaType<typeof dealerApplicationSchema> & { _id: mongoose.Types.ObjectId };

export const DealerApplicationModel =
  (mongoose.models.DealerApplication as mongoose.Model<DealerApplicationDocument> | undefined) ??
  mongoose.model<DealerApplicationDocument>('DealerApplication', dealerApplicationSchema);