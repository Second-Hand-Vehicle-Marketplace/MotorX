import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { storageConfig } from '../../config/storage.js';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: storageConfig.maxImageBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    callback(null, storageConfig.allowedImageTypes.has(file.mimetype));
  },
}).single('image');

// Parses one in-memory image and converts Multer failures into validation errors.
export function uploadSingleListingImage(request: Request, response: Response, next: NextFunction): void {
  imageUpload(request, response, (error) => {
    if (error) return next(new AppError(400, errorCodes.validation, error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      ? `The image exceeds the ${storageConfig.maxImageBytes / 1024 / 1024} MB limit.`
      : 'The image upload is invalid.'));
    if (!request.file) return next(new AppError(400, errorCodes.validation, 'A JPEG, PNG, or WebP image is required.'));
    next();
  });
}
