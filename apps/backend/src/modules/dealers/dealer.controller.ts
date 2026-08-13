import type { Request, Response } from 'express';
import { verifyFirebaseIdToken } from '../../config/firebase.js';
import { dealerService } from './dealer.service.js';

export const registerDealerApplication = async (request: Request, response: Response) => {
  const payload = request.body ?? {};
  const normalizedEmail = String(payload.email ?? '').trim();
  const idToken = String(payload.idToken ?? '').trim();

  if (!normalizedEmail || !String(payload.businessName ?? '').trim()) {
    response.status(400).json({
      success: false,
      message: 'Business name and email are required to submit a dealer application.',
      data: null,
      meta: null,
    });
    return;
  }

  if (!idToken) {
    response.status(400).json({
      success: false,
      message: 'Firebase identity token is required for dealer registration.',
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

  if (decodedToken.email.toLowerCase() !== normalizedEmail.toLowerCase()) {
    response.status(400).json({
      success: false,
      message: 'Registration email does not match signed-in Firebase account.',
      data: null,
      meta: null,
    });
    return;
  }

  const application = await dealerService.createApplication({
    firebaseUid: decodedToken.uid,
    applicantName: String(payload.applicantName ?? '').trim(),
    email: normalizedEmail,
    businessName: String(payload.businessName ?? '').trim(),
    businessLicense: String(payload.businessLicense ?? '').trim(),
    phone: String(payload.phone ?? '').trim(),
    address: String(payload.address ?? '').trim(),
  });

  response.status(201).json({
    success: true,
    message: 'Dealer application submitted successfully.',
    data: application,
    meta: null,
  });
};

export const getDealerApplications = async (_request: Request, response: Response) => {
  const applications = await dealerService.listApplications();
  response.status(200).json({
    success: true,
    message: 'Dealer applications retrieved successfully.',
    data: applications,
    meta: null,
  });
};

export const approveDealerApplication = async (request: Request, response: Response) => {
  const applicationId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const application = await dealerService.updateStatus(applicationId, 'approved');

  if (!application) {
    response.status(404).json({ success: false, message: 'Dealer application not found.', data: null, meta: null });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Dealer application approved successfully.',
    data: application,
    meta: null,
  });
};

export const rejectDealerApplication = async (request: Request, response: Response) => {
  const applicationId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
  const application = await dealerService.updateStatus(applicationId, 'rejected');

  if (!application) {
    response.status(404).json({ success: false, message: 'Dealer application not found.', data: null, meta: null });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Dealer application rejected successfully.',
    data: application,
    meta: null,
  });
};
