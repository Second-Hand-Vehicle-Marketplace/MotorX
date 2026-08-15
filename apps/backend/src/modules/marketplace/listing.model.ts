import mongoose, { type HydratedDocument, type Types } from 'mongoose';
import {
  listingStatuses,
  vehicleCategories,
  type ListingStatus,
  type VehicleCategory,
  type VehicleDetails,
} from '@motorx/shared-contracts';

export type { ListingStatus, VehicleCategory };

export interface ListingImage {
  key: string;
  url: string;
  alt?: string;
  order: number;
}

// `category` + `attributes` together form a VehicleDetails pair; Mongoose stores `attributes` as
// Mixed (category-specific shapes don't map cleanly onto a single fixed schema), while the Zod
// schemas in @motorx/shared-contracts are the actual validation gate before anything reaches here.
export type Listing = {
  dealerId: Types.ObjectId;
  sourceUploadJobId?: Types.ObjectId;
  registrationNumber: string;
  normalizedRegistrationNumber: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  location: string;
  description?: string;
  images: ListingImage[];
  status: ListingStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
} & VehicleDetails;

export type ListingDocument = HydratedDocument<Listing>;

const { Schema, model, models } = mongoose;

const listingImageSchema = new Schema<ListingImage>(
  {
    key: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, maxlength: 200 },
    order: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const listingSchema = new Schema<Listing>(
  {
    dealerId: { type: Schema.Types.ObjectId, required: true, ref: 'AuthUser' },
    sourceUploadJobId: { type: Schema.Types.ObjectId, ref: 'UploadJob' },
    registrationNumber: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    normalizedRegistrationNumber: { type: String, required: true, maxlength: 20 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    make: { type: String, required: true, trim: true, maxlength: 80 },
    model: { type: String, required: true, trim: true, maxlength: 80 },
    year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
    category: { type: String, enum: vehicleCategories, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true, default: 'LKR', maxlength: 3 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 5_000 },
    attributes: { type: Schema.Types.Mixed, required: true },
    images: { type: [listingImageSchema], default: [] },
    status: { type: String, enum: listingStatuses, required: true, default: 'draft' },
    publishedAt: { type: Date },
  },
  { timestamps: true, versionKey: false, collection: 'listings' },
);

listingSchema.index({ status: 1, publishedAt: -1, _id: -1 }, { name: 'status_publishedAt_id' });
listingSchema.index({ dealerId: 1, status: 1, createdAt: -1 }, { name: 'dealerId_status_createdAt' });
listingSchema.index({ make: 1, model: 1, year: -1 }, { name: 'make_model_year' });
listingSchema.index({ sourceUploadJobId: 1 }, { sparse: true, name: 'sourceUploadJobId' });
listingSchema.index({ category: 1, status: 1 }, { name: 'category_status' });
// Not unique: an archived/sold vehicle's registration number may legitimately be relisted later
// (by the same or a different dealer). Duplicate checks scope this to draft/active listings only.
listingSchema.index({ normalizedRegistrationNumber: 1 }, { name: 'normalizedRegistrationNumber' });

export const ListingModel = models.Listing ?? model<Listing>('Listing', listingSchema);
