import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';

const acceptedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
  fileFilter: (_request, file, callback) => callback(null, acceptedTypes.has(file.mimetype)),
}).fields([
  { name: 'businessRegistration', maxCount: 1 },
  { name: 'identityProof', maxCount: 1 },
  { name: 'additionalDocument', maxCount: 1 },
]);

export function uploadDealerDocuments(request: Request, response: Response, next: NextFunction): void {
  documentUpload(request, response, (error) => {
    if (error) return next(new AppError(400, errorCodes.validation,
      error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
        ? 'Each verification document must be 10 MB or smaller.'
        : 'Verification documents must be PDF, JPG, or PNG files.'));

    const files = request.files as Record<string, Express.Multer.File[]> | undefined;
    if (!files?.businessRegistration?.[0] || !files.identityProof?.[0]) {
      return next(new AppError(400, errorCodes.validation,
        'Business registration and identity proof documents are required.'));
    }
    next();
  });
}
