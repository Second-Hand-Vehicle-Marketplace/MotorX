import type { NextFunction, Response } from 'express';
import { firebaseAuth } from '../../config/firebase.js';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';
import type { AuthenticatedRequest } from '../types/authenticatedRequest.js';

// Verifies the bearer token and attaches its Firebase identity to the request.
export async function verifyFirebaseToken(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = request.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return next(new AppError(401, errorCodes.unauthorized, 'A Firebase ID token is required.'));

  try {
    request.firebaseUser = await firebaseAuth.verifyIdToken(match[1], true);
    next();
  } catch {
    next(new AppError(401, errorCodes.unauthorized, 'The Firebase ID token is invalid, expired, or revoked.'));
  }
}
