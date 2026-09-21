import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const inquirySchema = new Schema(
  {
    listingId: { type: String, required: true, index: true },
    dealerId: { type: String, required: true, index: true },
    type: { type: String, enum: ['contact', 'test_drive'], required: true },
    buyerName: { type: String, required: true, trim: true },
    buyerEmail: { type: String, required: true, lowercase: true, trim: true },
    buyerPhone: { type: String, trim: true },
    message: { type: String, trim: true },
    preferredDate: { type: String, trim: true },
    status: { type: String, enum: ['new', 'contacted', 'scheduled', 'closed'], default: 'new' },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type InquiryDocument = InferSchemaType<typeof inquirySchema> & { _id: mongoose.Types.ObjectId };

export const InquiryModel =
  (mongoose.models.Inquiry as mongoose.Model<InquiryDocument> | undefined) ??
  mongoose.model<InquiryDocument>('Inquiry', inquirySchema);
