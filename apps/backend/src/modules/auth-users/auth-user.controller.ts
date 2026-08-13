import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { getFirebaseAdmin, verifyFirebaseIdToken } from '../../config/firebase.js';
import { dealerService } from '../dealers/dealer.service.js';
import { UserModel, type UserDocument } from './user.model.js';

type Role = 'buyer' | 'dealer' | 'admin';
type DealerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

function toApiUser(user: UserDocument) {
  return {
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    role: user.role as Role,
    dealerStatus: user.dealerStatus as DealerStatus | undefined,
    businessName: user.businessName,
    businessLicense: user.businessLicense,
    phone: user.phone,
    address: user.address,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt.toISOString(),
    isActive: user.isActive,
  };
}

function extractBearerToken(request: Request): string {
  const header = String(request.headers.authorization ?? '');
  if (!header.toLowerCase().startsWith('bearer ')) {
    return '';
  }
  return header.slice(7).trim();
}

export const loginUser = async (request: Request, response: Response) => {
  if (!getFirebaseAdmin()) {
    response.status(503).json({
      success: false,
      message: 'Firebase Admin SDK is not configured on backend. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
      data: null,
      meta: null,
    });
    return;
  }

  const idToken = String(request.body?.idToken ?? '').trim();
  if (!idToken) {
    response.status(400).json({
      success: false,
      message: 'Firebase identity token is required.',
      data: null,
      meta: null,
    });
    return;
  }

  const decodedToken = await verifyFirebaseIdToken(idToken).catch(() => null);
  if (!decodedToken?.uid || !decodedToken.email) {
    response.status(401).json({
      success: false,
      message: 'Invalid Firebase token. Please sign in again.',
      data: null,
      meta: null,
    });
    return;
  }

  const email = decodedToken.email.toLowerCase();
  const application = await dealerService.findApplicationByEmail(email);

  if (application?.status === 'pending') {
    response.status(403).json({
      success: false,
      message: 'Registration submitted. An administrator must approve your dealership application before you can sign in.',
      data: null,
      meta: null,
    });
    return;
  }

  if (application?.status === 'rejected') {
    response.status(403).json({
      success: false,
      message: 'Your dealership application was rejected. Please contact support or resubmit with corrected details.',
      data: null,
      meta: null,
    });
    return;
  }

  const isOwnerAdmin = email === env.OWNER_ADMIN_EMAIL.toLowerCase();
  const role: Role = isOwnerAdmin ? 'admin' : application?.status === 'approved' ? 'dealer' : 'buyer';
  const displayName =
    role === 'dealer'
      ? application?.businessName ?? decodedToken.name ?? email
      : decodedToken.name ?? email;

  let user = await UserModel.findOne({
    $or: [{ firebaseUid: decodedToken.uid }, { email }],
  });

  if (!user) {
    user = await UserModel.create({
      firebaseUid: decodedToken.uid,
      email,
      displayName,
      role,
      dealerStatus: role === 'dealer' ? 'approved' : undefined,
      businessName: application?.businessName,
      businessLicense: application?.businessLicense,
      phone: application?.phone,
      address: application?.address,
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });
  } else {
    user.firebaseUid = decodedToken.uid;
    user.displayName = displayName;
    user.role = role;
    user.dealerStatus = role === 'dealer' ? 'approved' : user.dealerStatus;
    user.businessName = application?.businessName ?? user.businessName;
    user.businessLicense = application?.businessLicense ?? user.businessLicense;
    user.phone = application?.phone ?? user.phone;
    user.address = application?.address ?? user.address;
    user.lastLoginAt = new Date();
    await user.save();
  }

  response.status(200).json({
    success: true,
    message: 'User login successful.',
    data: toApiUser(user),
    meta: null,
  });
};

export const getCurrentUser = async (request: Request, response: Response) => {
  if (!getFirebaseAdmin()) {
    response.status(503).json({
      success: false,
      message: 'Firebase Admin SDK is not configured on backend.',
      data: null,
      meta: null,
    });
    return;
  }

  const tokenFromHeader = extractBearerToken(request);
  const tokenFromQuery = String(request.query.idToken ?? '').trim();
  const idToken = tokenFromHeader || tokenFromQuery;

  if (!idToken) {
    response.status(401).json({
      success: false,
      message: 'Authorization token is required.',
      data: null,
      meta: null,
    });
    return;
  }

  const decodedToken = await verifyFirebaseIdToken(idToken).catch(() => null);
  if (!decodedToken?.uid) {
    response.status(401).json({ success: false, message: 'Invalid token.', data: null, meta: null });
    return;
  }

  const user = await UserModel.findOne({ firebaseUid: decodedToken.uid });
  if (!user) {
    response.status(404).json({ success: false, message: 'User profile not found.', data: null, meta: null });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Current user retrieved successfully.',
    data: toApiUser(user),
    meta: null,
  });
};

export const logoutUser = (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: 'User logged out successfully.',
    data: null,
    meta: null,
  });
};
