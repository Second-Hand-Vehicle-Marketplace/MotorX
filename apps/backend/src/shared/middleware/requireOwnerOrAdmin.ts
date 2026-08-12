import type { NextFunction, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';
import type { AuthenticatedRequest } from '../types/authenticatedRequest.js';

export const requireOwnerOrAdmin = (ownerParameter = 'userId') =>
  (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    const user = request.localUser;
    if (!user) return next(new AppError(401, errorCodes.unauthorized, 'Authentication is required.'));
    if (user.role !== 'admin' && user.id !== request.params[ownerParameter]) return next(new AppError(403, errorCodes.forbidden, 'You do not own this resource.'));
    next();
  };
