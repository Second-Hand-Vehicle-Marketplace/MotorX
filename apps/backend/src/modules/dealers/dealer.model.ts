import mongoose, { type HydratedDocument, type Types } from 'mongoose';

export const dealerApplicationStatuses = ['pending', 'approved', 'rejected'] as const;
export type DealerApplicationStatus = (typeof dealerApplicationStatuses)[number];

export interface Dealer {
  userId: Types.ObjectId;
  businessName: string;
  registrationNumber: string;
  phone: string;
  address: string;
  status: DealerApplicationStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type DealerDocument = HydratedDocument<Dealer>;

const { Schema, model, models } = mongoose;
const dealerSchema = new Schema<Dealer>({
  userId: { type: Schema.Types.ObjectId, ref: 'AuthUser', required: true, unique: true, immutable: true },
  businessName: { type: String, required: true, trim: true, maxlength: 160 },
  registrationNumber: { type: String, required: true, trim: true, uppercase: true, unique: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  address: { type: String, required: true, trim: true, maxlength: 300 },
  status: { type: String, enum: dealerApplicationStatuses, required: true, default: 'pending' },
  rejectionReason: { type: String, trim: true, maxlength: 500 },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'AuthUser' },
  reviewedAt: Date,
}, { timestamps: true, versionKey: false, collection: 'dealers' });

dealerSchema.index({ status: 1, createdAt: 1 }, { name: 'status_createdAt' });

export const DealerModel = models.Dealer ?? model<Dealer>('Dealer', dealerSchema);
