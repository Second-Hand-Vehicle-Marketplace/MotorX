import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const listingSchema = new Schema(
  {
    dealerId: { type: String, required: true, trim: true },
    dealerName: { type: String, required: true, trim: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    bodyType: { type: String, required: true, trim: true },
    fuelType: { type: String, required: true, trim: true },
    transmission: { type: String, trim: true },
    condition: { type: String, trim: true },
    mileage: { type: Number, default: 0 },
    color: { type: String, trim: true },
    vin: { type: String, trim: true },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD', trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['active', 'pending', 'sold', 'hidden', 'archived'], default: 'active' },
    views: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    images: [{
      id: { type: String, trim: true },
      url: { type: String, trim: true },
      alt: { type: String, trim: true },
      isPrimary: { type: Boolean, default: false },
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

export type ListingDocument = InferSchemaType<typeof listingSchema> & { _id: mongoose.Types.ObjectId };

export const ListingModel =
  (mongoose.models.Listing as mongoose.Model<ListingDocument> | undefined) ??
  mongoose.model<ListingDocument>('Listing', listingSchema);
