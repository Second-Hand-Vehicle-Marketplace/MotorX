import { Router } from 'express';
import { UploadJobModel } from '../inventory/upload-job.model.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', async (_request, response) => {
  const jobs = await UploadJobModel.find().sort({ createdAt: -1 }).limit(20).lean();
  const data = jobs.map((job) => ({
    id: `nt_upl_${String(job._id)}`,
    userId: job.dealerId,
    title: `Upload ${job.status}`,
    message: `${job.csvFileName}${job.zipFileName ? ` + ${job.zipFileName}` : ''}: ${job.validRecords} valid and ${job.rejectedRecords} rejected rows.`,
    type: 'upload_completed',
    read: job.status === 'completed',
    createdAt: new Date(job.createdAt).toISOString(),
  }));

  response.status(200).json({ success: true, message: 'Notifications retrieved successfully.', data, meta: null });
});

notificationsRouter.patch('/:id/read', (_request, response) => {
  response.status(404).json({ success: false, message: 'Notification not found.', data: null, meta: null });
});
