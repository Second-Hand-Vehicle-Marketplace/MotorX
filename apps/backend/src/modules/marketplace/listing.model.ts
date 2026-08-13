import mongoose, { type HydratedDocument, type Types } from 'mongoose';

export const listingStatuses = ['draft', 'active', 'sold', 'archived'] as const;
export const fuelTypes = ['petrol', 'diesel', 'hybrid', 'electric', 'other'] as const;
export const transmissionTypes = ['automatic', 'manual', 'other'] as const;

export type ListingStatus = (typeof listingStatuses)[number];
export type FuelType = (typeof fuelTypes)[number];
export type TransmissionType = (typeof transmissionTypes)[number];

export interface ListingImage {
  key: string;
  url: string;
  alt?: string;
  order: number;
}

export interface Listing {
  dealerId: Types.ObjectId;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileageKm: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  location: string;
  description?: string;
  images: ListingImage[];
  status: ListingStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
    title: { type: String, required: true, trim: true, maxlength: 160 },
    make: { type: String, required: true, trim: true, maxlength: 80 },
    model: { type: String, required: true, trim: true, maxlength: 80 },
    year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true, default: 'LKR', maxlength: 3 },
    mileageKm: { type: Number, required: true, min: 0 },
    fuelType: { type: String, enum: fuelTypes, required: true },
    transmission: { type: String, enum: transmissionTypes, required: true },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 5_000 },
    images: { type: [listingImageSchema], default: [] },
    status: { type: String, enum: listingStatuses, required: true, default: 'draft' },
    publishedAt: { type: Date },
  },
  { timestamps: true, versionKey: false, collection: 'listings' },
);

listingSchema.index({ status: 1, publishedAt: -1, _id: -1 }, { name: 'status_publishedAt_id' });
listingSchema.index({ dealerId: 1, status: 1, createdAt: -1 }, { name: 'dealerId_status_createdAt' });
listingSchema.index({ make: 1, model: 1, year: -1 }, { name: 'make_model_year' });

export const ListingModel = models.Listing ?? model<Listing>('Listing', listingSchema);
