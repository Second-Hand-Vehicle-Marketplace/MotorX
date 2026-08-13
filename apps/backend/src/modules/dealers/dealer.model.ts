import mongoose, { type HydratedDocument, type Types } from 'mongoose';
import { dealerApplicationStatuses, type DealerApplicationStatus } from '@motorx/shared-contracts';

export type { DealerApplicationStatus };

export interface Dealer {
  userId: Types.ObjectId;
  businessName: string;
  registrationNumber: string;
  phone: string;
  address: string;
  representativeName: string;
  city: string;
  province: string;
  businessPhone: string;
  businessEmail: string;
  website?: string;
  dealershipType: 'new' | 'used' | 'both';
  brands: string[];
  description: string;
  inventoryCount?: number;
  verificationDocuments: Array<{ category: 'businessRegistration' | 'identityProof' | 'additionalDocument'; key: string; originalName: string; contentType: string; size: number }>;
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
  representativeName: { type: String, required: true, trim: true, maxlength: 120 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  province: { type: String, required: true, trim: true, maxlength: 100 },
  businessPhone: { type: String, required: true, trim: true, maxlength: 30 },
  businessEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  website: { type: String, trim: true, maxlength: 300 },
  dealershipType: { type: String, enum: ['new', 'used', 'both'], required: true },
  brands: { type: [String], default: [] },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  inventoryCount: { type: Number, min: 0, max: 100000 },
  verificationDocuments: { type: [{
    _id: false,
    category: { type: String, enum: ['businessRegistration', 'identityProof', 'additionalDocument'], required: true },
    key: { type: String, required: true },
    originalName: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
  }], default: [] },
  status: { type: String, enum: dealerApplicationStatuses, required: true, default: 'pending' },
  rejectionReason: { type: String, trim: true, maxlength: 500 },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'AuthUser' },
  reviewedAt: Date,
}, { timestamps: true, versionKey: false, collection: 'dealers' });

dealerSchema.index({ status: 1, createdAt: 1 }, { name: 'status_createdAt' });

export const DealerModel: mongoose.Model<Dealer> = models.Dealer ?? model<Dealer>('Dealer', dealerSchema);
