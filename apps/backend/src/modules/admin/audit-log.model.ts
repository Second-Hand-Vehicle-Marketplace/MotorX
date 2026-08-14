import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const auditLogSchema = new Schema(
  {
    eventType: { type: String, required: true, trim: true },
    actorId: { type: String, required: true, trim: true },
    actorName: { type: String, required: true, trim: true },
    targetId: { type: String, required: true, trim: true },
    targetName: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & { _id: mongoose.Types.ObjectId };

export const AuditLogModel =
  (mongoose.models.AuditLog as mongoose.Model<AuditLogDocument> | undefined) ??
  mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
