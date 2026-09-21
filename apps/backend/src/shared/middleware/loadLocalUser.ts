import type { NextFunction, Response } from 'express';
import { findOrCreateAuthUser } from '../../modules/auth-users/authUser.repository.js';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';
import type { AuthenticatedRequest } from '../types/authenticatedRequest.js';

// Loads or creates the local user associated with the verified Firebase identity.
export async function loadLocalUser(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
  try {
    if (!request.firebaseUser) return next(new AppError(401, errorCodes.unauthorized, 'Authentication is required.'));
    const user = await findOrCreateAuthUser(request.firebaseUser);
    if (!user) return next(new AppError(403, errorCodes.forbidden, 'A verified email address is required.'));
    request.localUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
