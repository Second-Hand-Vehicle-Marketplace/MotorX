import type { NextFunction, Response } from 'express';
import type { UserRole } from '../../modules/auth-users/authUser.model.js';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';
import type { AuthenticatedRequest } from '../types/authenticatedRequest.js';

export const requireRole = (...roles: readonly UserRole[]) =>
  (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    if (!request.localUser) return next(new AppError(401, errorCodes.unauthorized, 'Authentication is required.'));
    if (!roles.includes(request.localUser.role)) return next(new AppError(403, errorCodes.forbidden, 'You do not have permission to access this resource.'));
    next();
  };
