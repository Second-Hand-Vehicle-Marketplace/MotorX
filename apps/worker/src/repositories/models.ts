import mongoose, { Schema } from 'mongoose';

const uploadJobSchema = new Schema({
  dealerId: String, dealerName: String, csvFileName: String, zipFileName: String,
  csvObjectKey: String, zipObjectKey: String, status: String,
  totalRecords: Number, processedRecords: Number, validRecords: Number, rejectedRecords: Number,
  rejectedRows: { type: [Schema.Types.Mixed], default: [] }, errorMessage: String,
  createdAt: Date, completedAt: Date,
}, { collection: 'uploadjobs', versionKey: false });

const listingSchema = new Schema({
  dealerId: String, dealerName: String, make: String, model: String, year: Number,
  bodyType: String, fuelType: String, transmission: String, condition: String,
  mileage: Number, color: String, vin: String, plateNumber: String, price: Number, currency: String,
  title: String, description: String, images: { type: [Schema.Types.Mixed], default: [] },
  status: String, views: { type: Number, default: 0 }, leads: { type: Number, default: 0 },
  sourceUploadJobId: String,
  createdAt: Date, updatedAt: Date,
}, { collection: 'listings', versionKey: false });

const auditLogSchema = new Schema({
  eventType: String, actorId: String, actorName: String, targetId: String, targetName: String,
  details: String, timestamp: { type: Date, default: Date.now },
}, { collection: 'auditlogs', versionKey: false });

export const UploadJobModel = mongoose.models.UploadJob ?? mongoose.model('UploadJob', uploadJobSchema);
export const ListingModel = mongoose.models.Listing ?? mongoose.model('Listing', listingSchema);
export const AuditLogModel = mongoose.models.AuditLog ?? mongoose.model('AuditLog', auditLogSchema);
