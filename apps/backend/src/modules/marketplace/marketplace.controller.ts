import type { Request, Response } from 'express';
import { ListingModel } from '../listings/listing.model.js';
import { toPublicStorageUrl, uploadFileToStorage } from '../../config/storage.js';
import { InquiryModel } from './inquiry.model.js';
import { sendMail } from '../../config/mailer.js';
import { UserModel } from '../auth-users/user.model.js';
import { AuditLogModel } from '../admin/audit-log.model.js';

const toApiListing = (listing: any) => ({
  id: String(listing._id ?? listing.id),
  dealerId: listing.dealerId,
  dealerName: listing.dealerName,
  dealerContact: listing.dealerContact,
  plateNumber: listing.plateNumber,
  make: listing.make,
  model: listing.model,
  year: Number(listing.year ?? 0),
  bodyType: listing.bodyType,
  fuelType: listing.fuelType,
  transmission: listing.transmission,
  condition: listing.condition,
  mileage: Number(listing.mileage ?? 0),
  color: listing.color,
  vin: listing.vin,
  price: Number(listing.price ?? 0),
  currency: listing.currency ?? 'USD',
  title: listing.title,
  description: listing.description,
  images: (listing.images ?? []).map((image: any) => ({ ...image, url: toPublicStorageUrl(image.url) })),
  status: listing.status ?? 'active',
  views: Number(listing.views ?? 0),
  leads: Number(listing.leads ?? 0),
  createdAt: listing.createdAt ? new Date(listing.createdAt).toISOString() : new Date().toISOString(),
  updatedAt: listing.updatedAt ? new Date(listing.updatedAt).toISOString() : new Date().toISOString(),
});

export const getListings = async (request: Request, response: Response) => {
  const page = Number(request.query.page ?? 1);
  const pageSize = Number(request.query.pageSize ?? 9);
  const search = String(request.query.search ?? '').trim().toLowerCase();
  const make = String(request.query.make ?? '').trim();
  const bodyType = String(request.query.bodyType ?? '').trim();
  const fuelType = String(request.query.fuelType ?? '').trim();
  const priceMax = Number(request.query.priceMax ?? 0);
  const sortBy = String(request.query.sortBy ?? 'newest');
  const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
  const safePageSize = Math.max(1, Number.isFinite(pageSize) ? pageSize : 9);

  const query: any = { status: { $nin: ['hidden', 'archived'] } };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { make: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { vin: { $regex: search, $options: 'i' } },
      { plateNumber: { $regex: search, $options: 'i' } },
    ];
  }

  if (make) query.make = { $regex: `^${make}$`, $options: 'i' };
  if (bodyType) query.bodyType = bodyType;
  if (fuelType) query.fuelType = fuelType;
  if (priceMax > 0) query.price = { $lte: priceMax };

  const sort: Record<string, 1 | -1> = sortBy === 'price-asc'
    ? { price: 1 }
    : sortBy === 'price-desc'
      ? { price: -1 }
      : sortBy === 'year-desc'
        ? { year: -1 }
        : sortBy === 'mileage-asc'
          ? { mileage: 1 }
          : { createdAt: -1 };

  const [totalDocs, rawListings] = await Promise.all([
    ListingModel.countDocuments(query),
    ListingModel.find(query).sort({ status: 1, ...sort }).skip((safePage - 1) * safePageSize).limit(safePageSize).lean(),
  ]);

  const data = rawListings.map(toApiListing);
  const total = totalDocs;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));

  response.status(200).json({
    success: true,
    message: 'Marketplace listings retrieved successfully.',
    data: {
      data,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    },
    meta: null,
  });
};

export const getMarketplaceStats = async (_request: Request, response: Response) => {
  const [activeVehicles, soldVehicles, registeredDealers] = await Promise.all([
    ListingModel.countDocuments({ status: 'active' }),
    ListingModel.countDocuments({ status: 'sold' }),
    UserModel.countDocuments({ role: 'dealer' }),
  ]);

  response.status(200).json({
    success: true,
    message: 'Marketplace statistics retrieved successfully.',
    data: { activeVehicles, soldVehicles, registeredDealers },
    meta: null,
  });
};

export const getListingById = async (request: Request, response: Response) => {
  const { id } = request.params;
  const listing = await ListingModel.findOneAndUpdate({ _id: id, status: { $nin: ['hidden', 'archived'] } }, { $inc: { views: 1 } }, { new: true }).lean();

  if (!listing) {
    response.status(404).json({
      success: false,
      message: 'Listing not found.',
      data: null,
      meta: null,
    });
    return;
  }

  const dealer = await UserModel.findById(listing.dealerId).select('email phone address').lean();
  const listingWithDealer = {
    ...listing,
    dealerContact: dealer ? { email: dealer.email, phone: dealer.phone, address: dealer.address } : undefined,
  };

  response.status(200).json({
    success: true,
    message: 'Listing retrieved successfully.',
    data: toApiListing(listingWithDealer),
    meta: null,
  });
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const createInquiry = async (request: Request, response: Response) => {
  const listing = await ListingModel.findById(request.params.id).lean();
  if (!listing) {
    response.status(404).json({ success: false, message: 'Listing not found.', data: null, meta: null });
    return;
  }

  const { type, buyerName, buyerEmail, buyerPhone, message, preferredDate } = request.body ?? {};
  if (!['contact', 'test_drive'].includes(type) || !buyerName || !buyerEmail) {
    response.status(400).json({ success: false, message: 'Inquiry type, name, and email are required.', data: null, meta: null });
    return;
  }

  const inquiry = await InquiryModel.create({
    listingId: String(listing._id),
    dealerId: listing.dealerId,
    type,
    buyerName,
    buyerEmail,
    buyerPhone,
    message,
    preferredDate,
  });

  await ListingModel.findByIdAndUpdate(listing._id, { $inc: { leads: 1 } });
  const dealer = await UserModel.findById(listing.dealerId).select('email').lean();
  const requestLabel = type === 'test_drive' ? 'Test drive request' : 'Buyer contact request';
  await sendMail({
    to: dealer?.email ?? '',
    subject: `${requestLabel}: ${listing.title}`,
    text: `${requestLabel} for ${listing.title}\n\nBuyer: ${buyerName}\nEmail: ${buyerEmail}\nPhone: ${buyerPhone || 'Not provided'}\n${preferredDate ? `Preferred date: ${preferredDate}\n` : ''}${message ? `Message: ${message}` : ''}`,
    html: `
      <div style="margin:0;background:#f4f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#172033">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e4e9f1;border-radius:14px;overflow:hidden">
          <div style="background:#12233f;padding:24px 28px;color:#ffffff">
            <div style="font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#9fb8d8">MotorX Marketplace</div>
            <h1 style="margin:8px 0 0;font-size:24px;font-weight:700">${escapeHtml(requestLabel)}</h1>
          </div>
          <div style="padding:28px">
            <p style="margin:0 0 20px;font-size:16px;line-height:1.6">A buyer is interested in your listing and would like to connect with your dealership.</p>
            <div style="background:#f6f8fb;border-left:4px solid #2f80ed;padding:16px 18px;margin-bottom:22px">
              <div style="font-size:12px;color:#68758a;text-transform:uppercase;letter-spacing:.8px">Vehicle</div>
              <div style="margin-top:5px;font-size:18px;font-weight:700">${escapeHtml(listing.title)}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#68758a;width:130px">Buyer</td><td style="padding:8px 0;font-weight:600">${escapeHtml(buyerName)}</td></tr>
              <tr><td style="padding:8px 0;color:#68758a">Email</td><td style="padding:8px 0"><a href="mailto:${escapeHtml(buyerEmail)}" style="color:#1769d1">${escapeHtml(buyerEmail)}</a></td></tr>
              <tr><td style="padding:8px 0;color:#68758a">Phone</td><td style="padding:8px 0"><a href="tel:${escapeHtml(buyerPhone || '')}" style="color:#1769d1">${escapeHtml(buyerPhone || 'Not provided')}</a></td></tr>
              ${preferredDate ? `<tr><td style="padding:8px 0;color:#68758a">Preferred time</td><td style="padding:8px 0;font-weight:600">${escapeHtml(preferredDate)}</td></tr>` : ''}
            </table>
            ${message ? `<div style="margin-top:20px;padding:16px;background:#fffaf0;border:1px solid #f0dfb5;border-radius:8px"><div style="font-size:12px;color:#8a6d2f;text-transform:uppercase;letter-spacing:.8px">Message</div><p style="margin:8px 0 0;line-height:1.6">${escapeHtml(message)}</p></div>` : ''}
            <p style="margin:24px 0 0;color:#68758a;font-size:13px;line-height:1.5">Please contact the buyer directly to continue the conversation.</p>
          </div>
        </div>
      </div>`,
  });

  response.status(201).json({
    success: true,
    message: type === 'test_drive' ? 'Test drive request submitted.' : 'Dealer contact request submitted.',
    data: { id: String(inquiry._id), status: inquiry.status },
    meta: null,
  });
};

export const updateListing = async (request: Request, response: Response) => {
  const allowedFields = ['make', 'model', 'year', 'price', 'mileage', 'bodyType', 'fuelType', 'transmission', 'condition', 'color', 'title', 'description', 'vin', 'plateNumber'];
  const updates = Object.fromEntries(Object.entries(request.body ?? {}).filter(([key]) => allowedFields.includes(key)));
  const listing = await ListingModel.findByIdAndUpdate(request.params.id, { $set: { ...updates, updatedAt: new Date() } }, { new: true }).lean();
  if (!listing) {
    response.status(404).json({ success: false, message: 'Listing not found.', data: null, meta: null });
    return;
  }
  response.status(200).json({ success: true, message: 'Listing updated successfully.', data: toApiListing(listing), meta: null });
};

export const updateListingStatus = async (request: Request, response: Response) => {
  const status = String(request.body?.status ?? '').trim();
  if (!['active', 'sold', 'pending', 'hidden'].includes(status)) {
    response.status(400).json({ success: false, message: 'Invalid listing status.', data: null, meta: null });
    return;
  }
  const listing = await ListingModel.findByIdAndUpdate(request.params.id, { $set: { status, updatedAt: new Date() } }, { new: true }).lean();
  if (!listing) {
    response.status(404).json({ success: false, message: 'Listing not found.', data: null, meta: null });
    return;
  }
  response.status(200).json({ success: true, message: 'Listing status updated.', data: toApiListing(listing), meta: null });
};

export const deleteListing = async (request: Request, response: Response) => {
  const listing = await ListingModel.findByIdAndDelete(request.params.id).lean();
  if (!listing) {
    response.status(404).json({ success: false, message: 'Listing not found.', data: null, meta: null });
    return;
  }
  response.status(200).json({ success: true, message: 'Listing permanently deleted.', data: { id: String(listing._id) }, meta: null });
};

export const createListing = async (request: Request, response: Response) => {
  const payload = request.body ?? {};
  const vin = String(payload.vin ?? '').trim().toUpperCase();
  const plateNumber = String(payload.plateNumber ?? '').trim().toUpperCase();
  if (!vin || !plateNumber) {
    response.status(400).json({ success: false, message: 'Both VIN and plate number are required.', data: null, meta: null });
    return;
  }

  const identifierFilters: Array<Record<string, string>> = [];
  if (vin) identifierFilters.push({ vin });
  if (plateNumber) identifierFilters.push({ plateNumber });
  const existingIdentifier = await ListingModel.findOne({ $or: identifierFilters });
  if (existingIdentifier) {
    response.status(409).json({ success: false, message: 'A listing with this VIN or plate number already exists.', data: null, meta: null });
    return;
  }

  const createdListing = await ListingModel.create({
    dealerId: payload.dealerId ?? 'usr_002',
    dealerName: payload.dealerName ?? 'Premium Autos',
    make: payload.make ?? 'BMW',
    model: payload.model ?? '3 Series',
    year: Number(payload.year ?? new Date().getFullYear()),
    bodyType: payload.bodyType ?? 'sedan',
    fuelType: payload.fuelType ?? 'petrol',
    transmission: payload.transmission ?? 'automatic',
    condition: payload.condition ?? 'excellent',
    mileage: Number(payload.mileage ?? 0),
    color: payload.color ?? 'Black',
    vin: vin || undefined,
    plateNumber: plateNumber || undefined,
    price: Number(payload.price ?? 0),
    currency: payload.currency ?? 'USD',
    title: payload.title ?? 'New Listing',
    description: payload.description ?? 'Newly created marketplace listing.',
    images: [],
    status: 'active',
    views: 0,
    leads: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const imageFiles = Array.isArray(request.files) ? request.files : [];
  const uploadedImages = [];
  for (const [index, file] of imageFiles.entries()) {
    const key = `listings/${createdListing._id.toString()}/images/${index}-${file.originalname}`;
    const url = await uploadFileToStorage(key, file.buffer, file.mimetype || 'application/octet-stream');
    uploadedImages.push({
      id: `${createdListing._id}-${index}`,
      url,
      alt: `${createdListing.make} ${createdListing.model}`,
      isPrimary: index === 0,
    });
  }

  if (uploadedImages.length) {
    await ListingModel.findByIdAndUpdate(createdListing._id, { $set: { images: uploadedImages } });
  }

  await AuditLogModel.create({
    eventType: 'listing_created',
    actorId: String(createdListing.dealerId),
    actorName: String(createdListing.dealerName),
    targetId: String(createdListing._id),
    targetName: String(createdListing.title),
    details: 'Manual vehicle listing created by dealer.',
  });

  response.status(201).json({
    success: true,
    message: 'Listing created successfully.',
    data: toApiListing(createdListing.toObject ? createdListing.toObject() : createdListing),
    meta: null,
  });
};
