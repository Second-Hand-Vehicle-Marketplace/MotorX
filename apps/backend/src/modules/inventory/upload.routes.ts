import { Router } from 'express';
import multer from 'multer';
import {
  getUploads,
  getUploadById,
  createUploadJob,
  processUploadCsv,
  downloadErrorLog,
} from './upload.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const uploadRouter = Router();

uploadRouter.get('/', getUploads);
uploadRouter.get('/:id', getUploadById);
uploadRouter.post('/', upload.fields([{ name: 'csv', maxCount: 1 }, { name: 'zip', maxCount: 1 }]), createUploadJob);
uploadRouter.post('/process', upload.fields([{ name: 'csv', maxCount: 1 }, { name: 'zip', maxCount: 1 }]), processUploadCsv);
uploadRouter.get('/:id/errors.csv', downloadErrorLog);
