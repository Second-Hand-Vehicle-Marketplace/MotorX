import type { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import unzipper from 'unzipper';
import { uploadFileToStorage } from '../../config/storage.js';
import { ListingModel } from '../listings/listing.model.js';
import { UploadJobModel } from './upload-job.model.js';
import { AuditLogModel } from '../admin/audit-log.model.js';

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

const getField = (row: Record<string, unknown>, names: string[]): string => {
  const key = names.find((name) => row[name] !== undefined && row[name] !== null);
  return key ? String(row[key] ?? '').trim() : '';
};

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const imageColumns = (row: Record<string, unknown>) => Object.entries(row)
  .filter(([key, value]) => /^image\d*$/i.test(key) && String(value ?? '').trim())
  .map(([, value]) => String(value).trim());

async function readZipImages(file: Express.Multer.File | undefined) {
  const images = new Map<string, { buffer: Buffer; contentType: string; originalPath: string }>();
  if (!file) return images;
  const directory = await unzipper.Open.buffer(file.buffer);
  for (const entry of directory.files) {
    if (entry.type !== 'File' || !/\.(png|jpe?g|webp|gif)$/i.test(entry.path)) continue;
    const normalizedPath = entry.path.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
    const extension = normalizedPath.split('.').pop() ?? 'jpeg';
    const image = { buffer: await entry.buffer(), contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`, originalPath: entry.path };
    images.set(normalizedPath, image);
    images.set(normalizedPath.split('/').pop() ?? normalizedPath, image);
  }
  return images;
}

const findImage = (images: Map<string, { buffer: Buffer; contentType: string; originalPath: string }>, reference: string) => {
  const normalized = reference.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
  const basename = normalized.split('/').pop() ?? normalized;
  const exact = images.get(normalized) ?? images.get(basename);
  if (exact) return exact;

  const referenceStem = basename.replace(/\.[^.]+$/, '');
  for (const [key, image] of images.entries()) {
    if (key.split('/').pop()?.replace(/\.[^.]+$/, '') === referenceStem) return image;
  }
  return undefined;
};

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

  const dealerId = String(payload.dealerId ?? '');
  const dealerName = String(payload.dealerName ?? '');
  const job = await UploadJobModel.create({
    dealerId,
    dealerName,
    csvFileName: csvFile.originalname,
    zipFileName: zipFile?.originalname,
    fileSize: csvFile.size + (zipFile?.size ?? 0),
    status: 'processing',
  });

  try {
    const jobPrefix = `uploads/${job._id.toString()}`;
    await uploadFileToStorage(`${jobPrefix}/source/${csvFile.originalname}`, csvFile.buffer, csvFile.mimetype || 'text/csv');
    if (zipFile) await uploadFileToStorage(`${jobPrefix}/source/${zipFile.originalname}`, zipFile.buffer, zipFile.mimetype || 'application/zip');

    const imageFiles = await readZipImages(zipFile);
    const rows = parse(csvFile.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true }) as Record<string, unknown>[];
    const rejectedRows: RejectedRow[] = [];
    let validRecords = 0;

    for (const [index, row] of rows.entries()) {
      const make = getField(row, ['make', 'Make']);
      const model = getField(row, ['model', 'Model']);
      const year = getField(row, ['year', 'Year']);
      const price = getField(row, ['price', 'Price']);
      const errors: string[] = [];
      if (!make) errors.push('Make is required');
      if (!model) errors.push('Model is required');
      if (!year || !Number.isFinite(Number(year))) errors.push('Year must be a valid number');
      if (!price || toNumber(price) <= 0) errors.push('Price must be a positive number');
      if (errors.length) {
        rejectedRows.push({ row: index + 2, data: Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? '')])), errors });
        continue;
      }

      const uploadedImages = [];
      for (const [imageIndex, reference] of imageColumns(row).entries()) {
        const image = findImage(imageFiles, reference);
        if (!image) continue;
        const imageKey = `${jobPrefix}/images/${index + 1}-${imageIndex}-${image.originalPath.split('/').pop()}`;
        const url = await uploadFileToStorage(imageKey, image.buffer, image.contentType);
        uploadedImages.push({ id: `${job._id}-${index + 1}-${imageIndex}`, url, alt: `${make} ${model}`, isPrimary: imageIndex === 0 });
      }

      await ListingModel.create({
        dealerId,
        dealerName,
        make,
        model,
        year: Number(year),
        bodyType: getField(row, ['bodyType', 'body_type', 'Body Type']) || 'sedan',
        fuelType: getField(row, ['fuelType', 'fuel_type', 'Fuel Type']) || 'petrol',
        transmission: getField(row, ['transmission', 'Transmission']) || 'automatic',
        condition: getField(row, ['condition', 'Condition']) || 'good',
        mileage: toNumber(getField(row, ['mileage', 'Mileage'])),
        color: getField(row, ['color', 'Color']),
        vin: getField(row, ['vin', 'VIN']),
        price: toNumber(price),
        currency: getField(row, ['currency', 'Currency']) || 'USD',
        title: getField(row, ['title', 'Title']) || `${year} ${make} ${model}`,
        description: getField(row, ['description', 'Description']),
        images: uploadedImages,
        status: 'active',
      });
      validRecords += 1;
    }

    const updated = await UploadJobModel.findByIdAndUpdate(job._id, {
      status: rejectedRows.length ? 'completedWithErrors' : 'completed',
      totalRecords: rows.length,
      processedRecords: rows.length,
      validRecords,
      rejectedRecords: rejectedRows.length,
      rejectedRows,
      completedAt: new Date(),
    }, { new: true }).lean();

    await AuditLogModel.create({
      eventType: 'upload_completed',
      actorId: dealerId,
      actorName: dealerName || dealerId,
      targetId: String(job._id),
      targetName: csvFile.originalname,
      details: `Inventory batch completed with ${validRecords} valid and ${rejectedRows.length} rejected rows.`,
    });

    response.status(201).json({ success: true, message: 'CSV and ZIP inventory processed successfully.', data: toApiJob(updated), meta: null });
  } catch (error) {
    await UploadJobModel.findByIdAndUpdate(job._id, { status: 'failed', errorMessage: error instanceof Error ? error.message : 'Upload processing failed.' });
    response.status(500).json({ success: false, message: 'Inventory processing failed.', data: null, meta: null });
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
