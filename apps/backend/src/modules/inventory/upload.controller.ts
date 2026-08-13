import type { Request, Response } from 'express';
import { uploadQueue } from '../../config/redis.js';
import { uploadFileToStorage } from '../../config/storage.js';
import { UploadJobModel } from './upload-job.model.js';

type RejectedRow = { row: number; data: Record<string, string>; errors: string[] };

const toApiJob = (job: any) => ({
  id: String(job._id ?? job.id),
  dealerId: job.dealerId,
  dealerName: job.dealerName,
  fileName: job.csvFileName,
  csvFileName: job.csvFileName,
  zipFileName: job.zipFileName,
  fileSize: job.fileSize ?? 0,
  status: job.status,
  totalRecords: job.totalRecords ?? 0,
  processedRecords: job.processedRecords ?? 0,
  validRecords: job.validRecords ?? 0,
  rejectedRecords: job.rejectedRecords ?? 0,
  rejectedRows: job.rejectedRows ?? [],
  createdAt: new Date(job.createdAt).toISOString(),
  completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
  errorMessage: job.errorMessage,
});

export const getUploads = async (request: Request, response: Response) => {
  const query = request.query.dealerId ? { dealerId: String(request.query.dealerId) } : {};
  const jobs = await UploadJobModel.find(query).sort({ createdAt: -1 }).lean();
  response.status(200).json({ success: true, message: 'Upload jobs retrieved successfully.', data: jobs.map(toApiJob), meta: null });
};

export const getUploadById = async (request: Request, response: Response) => {
  const job = await UploadJobModel.findById(request.params.id).lean();
  if (!job) {
    response.status(404).json({ success: false, message: 'Upload job not found.', data: null, meta: null });
    return;
  }
  response.status(200).json({ success: true, message: 'Upload job retrieved successfully.', data: toApiJob(job), meta: null });
};

export const createUploadJob = async (request: Request, response: Response) => {
  const files = request.files && !Array.isArray(request.files) ? request.files : {};
  const csvFile = files.csv?.[0];
  const zipFile = files.zip?.[0];
  const payload = request.body ?? {};

  if (!csvFile || !zipFile) {
    response.status(400).json({ success: false, message: 'Both the CSV inventory file and its matching ZIP image bundle are required.', data: null, meta: null });
    return;
  }

  const job = await UploadJobModel.create({
    dealerId: String(payload.dealerId ?? ''),
    dealerName: String(payload.dealerName ?? ''),
    csvFileName: csvFile.originalname,
    zipFileName: zipFile.originalname,
    fileSize: csvFile.size + zipFile.size,
    status: 'pending',
  });

  try {
    const prefix = `uploads/${job._id.toString()}/source`;
    const csvObjectKey = `${prefix}/${csvFile.originalname}`;
    const zipObjectKey = `${prefix}/${zipFile.originalname}`;
    const csvFileUrl = await uploadFileToStorage(csvObjectKey, csvFile.buffer, csvFile.mimetype || 'text/csv');
    const zipFileUrl = await uploadFileToStorage(zipObjectKey, zipFile.buffer, zipFile.mimetype || 'application/zip');

    await UploadJobModel.findByIdAndUpdate(job._id, { csvObjectKey, zipObjectKey, csvFileUrl, zipFileUrl });
    await uploadQueue.add('inventory-upload', {
      uploadJobId: String(job._id),
      dealerId: job.dealerId,
      dealerName: job.dealerName,
      csvObjectKey,
      zipObjectKey,
      csvFileName: csvFile.originalname,
      zipFileName: zipFile.originalname,
    }, { removeOnComplete: 100, removeOnFail: 100 });

    const queued = await UploadJobModel.findById(job._id).lean();
    response.status(202).json({ success: true, message: 'Inventory batch queued for ETL processing.', data: toApiJob(queued), meta: null });
  } catch (error) {
    await UploadJobModel.findByIdAndUpdate(job._id, { status: 'failed', errorMessage: error instanceof Error ? error.message : 'Upload could not be queued.' });
    response.status(500).json({ success: false, message: 'Inventory upload could not be queued.', data: null, meta: null });
  }
};

export const processUploadCsv = createUploadJob;

export const downloadErrorLog = async (request: Request, response: Response) => {
  const job = await UploadJobModel.findById(request.params.id).lean();
  if (!job) {
    response.status(404).json({ success: false, message: 'Upload job not found.', data: null, meta: null });
    return;
  }
  const rows = (job.rejectedRows ?? []) as RejectedRow[];
  const lines = ['row,make,model,year,price,errors', ...rows.map((row) => [row.row, row.data.make ?? '', row.data.model ?? '', row.data.year ?? '', row.data.price ?? '', row.errors.join('; ')].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))];
  response.status(200).setHeader('Content-Type', 'text/csv').setHeader('Content-Disposition', `attachment; filename="${job.csvFileName.replace(/\.csv$/i, '')}-errors.csv"`).send(lines.join('\n'));
};
