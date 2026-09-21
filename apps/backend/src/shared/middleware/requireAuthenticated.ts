import type { NextFunction, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';
import type { AuthenticatedRequest } from '../types/authenticatedRequest.js';

// Allows only authenticated users whose local account is active.
export function requireAuthenticated(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
  if (!request.firebaseUser || !request.localUser) return next(new AppError(401, errorCodes.unauthorized, 'Authentication is required.'));
  if (request.localUser.status !== 'active') return next(new AppError(403, errorCodes.forbidden, 'This account is not active.'));
  next();
}
