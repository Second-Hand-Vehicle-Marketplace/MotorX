import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { storageConfig } from '../../config/storage.js';
import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: storageConfig.maxInventoryBytes, files: 1 }, fileFilter: (_request, file, callback) => callback(null, storageConfig.allowedInventoryTypes.has(file.mimetype)) }).single('file');

// Parses one CSV and converts Multer errors into stable validation responses.
export function uploadSingleInventoryCsv(request: Request, response: Response, next: NextFunction) {
  csvUpload(request, response, (error) => {
    if (error) return next(new AppError(400, errorCodes.validation, error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? `The CSV exceeds the ${storageConfig.maxInventoryBytes / 1024 / 1024} MB limit.` : 'The inventory upload is invalid.'));
    if (!request.file) return next(new AppError(400, errorCodes.validation, 'A supported CSV file is required in the file field.'));
    next();
  });
}
