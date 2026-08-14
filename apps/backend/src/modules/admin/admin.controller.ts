import type { Request, Response } from 'express';
import { dealerService } from '../dealers/dealer.service.js';
import { UserModel } from '../auth-users/user.model.js';
import { ListingModel } from '../listings/listing.model.js';
import { UploadJobModel } from '../inventory/upload-job.model.js';
import { toPublicStorageUrl } from '../../config/storage.js';
import { AuditLogModel } from './audit-log.model.js';

const recordAudit = async (eventType: string, targetId: string, targetName: string, details: string) => {
  await AuditLogModel.create({
    eventType,
    actorId: 'admin',
    actorName: 'Administrator',
    targetId,
    targetName,
    details,
  });
};

const users: any[] = [];

export const getUsers = (_request: Request, response: Response) => {
  void (async () => {
    const dbUsers = await UserModel.find().sort({ createdAt: -1 }).lean();
    const mapped = dbUsers.map((user) => ({
      id: String(user._id),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      dealerStatus: user.dealerStatus,
      isActive: user.isActive,
      createdAt: new Date(user.createdAt).toISOString(),
      lastLoginAt: new Date(user.lastLoginAt).toISOString(),
      businessName: user.businessName,
      businessLicense: user.businessLicense,
      phone: user.phone,
      address: user.address,
    }));

    response.status(200).json({ success: true, message: 'Users retrieved successfully.', data: mapped, meta: null });
  })();
};

export const getListings = (_request: Request, response: Response) => {
  void (async () => {
    const dbListings = await ListingModel.find().sort({ createdAt: -1 }).lean();
    response.status(200).json({
      success: true,
      message: 'Listings retrieved successfully.',
      data: dbListings.map((listing) => ({
        id: String(listing._id),
        dealerId: listing.dealerId,
        dealerName: listing.dealerName,
        make: listing.make,
        model: listing.model,
        year: listing.year,
        mileage: listing.mileage,
        price: listing.price,
        status: listing.status,
        title: listing.title,
        vin: listing.vin,
        plateNumber: listing.plateNumber,
        images: (listing.images ?? []).map((image: any) => ({ ...image, url: toPublicStorageUrl(image.url) })),
        createdAt: new Date(listing.createdAt).toISOString(),
        views: listing.views,
      })),
      meta: null,
    });
  })();
};

export const getUploadJobs = (_request: Request, response: Response) => {
  void (async () => {
    const jobs = await UploadJobModel.find().sort({ createdAt: -1 }).lean();
    response.status(200).json({
      success: true,
      message: 'Upload jobs retrieved successfully.',
      data: jobs.map((job) => ({
        id: String(job._id),
        dealerId: job.dealerId,
        dealerName: job.dealerName,
        fileName: job.csvFileName,
        csvFileName: job.csvFileName,
        zipFileName: job.zipFileName,
        fileSize: job.fileSize,
        status: job.status,
        totalRecords: job.totalRecords,
        processedRecords: job.processedRecords,
        validRecords: job.validRecords,
        rejectedRecords: job.rejectedRecords,
        rejectedRows: job.rejectedRows,
        createdAt: new Date(job.createdAt).toISOString(),
        completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
      })),
      meta: null,
    });
  })();
};

export const getSystemHealth = (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: 'System health retrieved successfully.',
    data: {
      api: { status: 'UP', latencyMs: 14 },
      database: { status: 'CONNECTED', details: 'MongoDB pool healthy' },
      queue: { status: 'HEALTHY', jobsFailed: 0 },
      storage: { status: 'READY', bucket: 'motorx-dev' },
      worker: { status: 'PROCESSING', uptime: '99.98%' },
    },
    meta: null,
  });
};

export const getAuditLogs = (_request: Request, response: Response) => {
  void (async () => {
    const logs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(200).lean();
    response.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully.',
      data: logs.map((log) => ({ ...log, id: String(log._id), timestamp: new Date(log.timestamp).toISOString() })),
      meta: null,
    });
  })();
};

export const updateUserStatus = (request: Request, response: Response) => {
  void (async () => {
    const { id } = request.params;
    const { isActive } = request.body ?? {};
    const target = await UserModel.findByIdAndUpdate(id, { $set: { isActive: Boolean(isActive) } }, { new: true });

    if (!target) {
      response.status(404).json({ success: false, message: 'User not found.', data: null, meta: null });
      return;
    }

    await recordAudit(target.isActive ? 'user_activated' : 'user_suspended', String(target._id), target.displayName, `${target.displayName} was ${target.isActive ? 'activated' : 'suspended'} by admin action`);

    response.status(200).json({
      success: true,
      message: 'User status updated.',
      data: {
        id: String(target._id),
        email: target.email,
        displayName: target.displayName,
        role: target.role,
        isActive: target.isActive,
      },
      meta: null,
    });
  })();
};

export const updateDealerStatus = (request: Request, response: Response) => {
  void (async () => {
    const dealerId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const { status } = request.body ?? {};
    const normalizedStatus = status === 'approved' ? 'approved' : 'rejected';

    const updatedApplication = await dealerService.updateStatus(dealerId, normalizedStatus);
    if (!updatedApplication) {
      response.status(404).json({ success: false, message: 'Dealer not found.', data: null, meta: null });
      return;
    }

    await UserModel.updateOne(
      { email: updatedApplication.email.toLowerCase() },
      {
        $set: {
          role: normalizedStatus === 'approved' ? 'dealer' : 'buyer',
          dealerStatus: normalizedStatus,
          businessName: updatedApplication.businessName,
          businessLicense: updatedApplication.businessLicense,
          phone: updatedApplication.phone,
          address: updatedApplication.address,
        },
      },
    );

    await recordAudit(normalizedStatus === 'approved' ? 'dealer_approved' : 'dealer_rejected', updatedApplication.id, updatedApplication.businessName, `Dealer application ${normalizedStatus} by admin review`);

    response.status(200).json({ success: true, message: 'Dealer status updated.', data: updatedApplication, meta: null });
  })();
};

export const updateListingStatus = (request: Request, response: Response) => {
  void (async () => {
    const { id } = request.params;
    const { status } = request.body ?? {};
    const target = await ListingModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();

    if (!target) {
      response.status(404).json({ success: false, message: 'Listing not found.', data: null, meta: null });
      return;
    }

    await recordAudit('listing_removed', String(target._id), target.title, `Listing ${target.status} by admin moderation`);
    response.status(200).json({
      success: true,
      message: 'Listing status updated.',
      data: {
        id: String(target._id),
        status: target.status,
        title: target.title,
        dealerName: target.dealerName,
      },
      meta: null,
    });
  })();
};

export const deleteListing = (request: Request, response: Response) => {
  void (async () => {
    const target = await ListingModel.findByIdAndDelete(request.params.id).lean();
    if (!target) {
      response.status(404).json({ success: false, message: 'Listing not found.', data: null, meta: null });
      return;
    }
    await recordAudit('listing_removed', String(target._id), target.title, 'Listing permanently deleted by admin moderation.');
    response.status(200).json({ success: true, message: 'Listing permanently deleted.', data: { id: String(target._id) }, meta: null });
  })();
};

