import type { Types } from 'mongoose';
import { UploadJobModel } from './uploadJob.model.js';

// Creates the durable pending job before it is published to Redis.
export function createUploadJob(input: { dealerId: Types.ObjectId; fileName: string; fileSize: number; storageKey: string }) { return UploadJobModel.create({ ...input, status: 'pending' }); }

// Lists only upload jobs owned by the authenticated dealer.
export async function listDealerUploadJobs(dealerId: Types.ObjectId, page: number, limit: number) { const filter = { dealerId }; const [documents, total] = await Promise.all([UploadJobModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), UploadJobModel.countDocuments(filter)]); return { documents, total }; }

// Finds one upload only when it belongs to the authenticated dealer.
export function findDealerUploadJob(uploadId: string, dealerId: Types.ObjectId) { return UploadJobModel.findOne({ _id: uploadId, dealerId }).lean(); }

// Removes a pending record during compensation after enqueueing failure.
export function deletePendingUploadJob(uploadId: string, dealerId: Types.ObjectId) { return UploadJobModel.deleteOne({ _id: uploadId, dealerId, status: 'pending' }); }
