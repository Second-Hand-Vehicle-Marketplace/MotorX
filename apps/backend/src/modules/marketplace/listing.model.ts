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
  // CSV row this listing was imported from, so a retried import never creates it twice.
  sourceRowNumber?: number;
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
  embedding?: number[];
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
    sourceRowNumber: { type: Number, min: 2 },
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
    embedding: { type: [Number], select: false, default: undefined },
  },
  { timestamps: true, versionKey: false, collection: 'listings' },
);

listingSchema.index({ status: 1, publishedAt: -1, _id: -1 }, { name: 'status_publishedAt_id' });
listingSchema.index({ dealerId: 1, status: 1, createdAt: -1 }, { name: 'dealerId_status_createdAt' });
listingSchema.index({ make: 1, model: 1, year: -1 }, { name: 'make_model_year' });
listingSchema.index({ sourceUploadJobId: 1 }, { sparse: true, name: 'sourceUploadJobId' });
listingSchema.index({ sourceUploadJobId: 1, sourceRowNumber: 1 }, { unique: true, partialFilterExpression: { sourceRowNumber: { $exists: true } }, name: 'sourceUploadJobId_sourceRowNumber' });
listingSchema.index({ category: 1, status: 1 }, { name: 'category_status' });
listingSchema.index({ status: 1, category: 1, price: 1 }, { name: 'status_category_price' });
listingSchema.index({ status: 1, category: 1, year: -1 }, { name: 'status_category_year' });
listingSchema.index({ status: 1, 'attributes.fuelType': 1, 'attributes.transmission': 1 }, { name: 'status_fuel_transmission' });
listingSchema.index({ status: 1, 'attributes.bodyType': 1, 'attributes.condition': 1 }, { name: 'status_body_condition' });
listingSchema.index({ status: 1, 'attributes.mileageKm': 1 }, { name: 'status_mileage' });
listingSchema.index({ status: 1, location: 1 }, { name: 'status_location' });
// Partial unique: only one draft/active listing may exist per registration number at a time.
// Archived/sold listings are excluded from the filter, so relisting a since-sold vehicle is
// still fine. This is the DB-level backstop for assertRegistrationNotActivelyListed's check in
// listing.service.ts, which alone can't prevent two concurrent requests from both passing the
// check before either write lands.
listingSchema.index(
  { normalizedRegistrationNumber: 1 },
  { name: 'normalizedRegistrationNumber_unique_active', unique: true, partialFilterExpression: { status: { $in: ['draft', 'active'] } } },
);

export const ListingModel = models.Listing ?? model<Listing>('Listing', listingSchema);
