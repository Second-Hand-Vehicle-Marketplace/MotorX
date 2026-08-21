import mongoose, { type Types } from 'mongoose';

export type AdminAuditEvent = 'dealer_approved' | 'dealer_rejected' | 'user_suspended' | 'user_activated' | 'listing_removed';
export interface AdminAuditLog { eventType: AdminAuditEvent; actorId: Types.ObjectId; targetId: Types.ObjectId; targetName: string; details: string; createdAt: Date }

const { Schema, model, models } = mongoose;
const adminAuditLogSchema = new Schema<AdminAuditLog>({
  eventType: { type: String, enum: ['dealer_approved', 'dealer_rejected', 'user_suspended', 'user_activated', 'listing_removed'], required: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'AuthUser', required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  targetName: { type: String, required: true, trim: true },
  details: { type: String, required: true, trim: true, maxlength: 500 },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: 'auditLogs' });

adminAuditLogSchema.index({ createdAt: -1, _id: -1 });
adminAuditLogSchema.index({ eventType: 1, createdAt: -1 });
export const AdminAuditLogModel = models.AdminAuditLog ?? model<AdminAuditLog>('AdminAuditLog', adminAuditLogSchema);
