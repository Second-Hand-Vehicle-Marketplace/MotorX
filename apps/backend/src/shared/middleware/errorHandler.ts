import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { errorCodes } from '../errors/errorCodes.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const known = error instanceof AppError;
  response.status(known ? error.statusCode : 500).json({
    success: false,
    error: { code: known ? error.code : errorCodes.internal, message: known ? error.message : 'An unexpected error occurred.' },
    meta: null,
  });
};
