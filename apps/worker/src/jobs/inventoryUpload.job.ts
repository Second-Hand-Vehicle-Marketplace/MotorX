import { Job } from 'bullmq';
import { downloadObject, uploadObject } from '../config/storage.js';
import { ListingModel, UploadJobModel, AuditLogModel } from '../repositories/models.js';
import { extract } from '../pipeline/extract.js';
import { detectDuplicates } from '../pipeline/detectDuplicates.js';
import { enrich } from '../pipeline/enrich.js';
import { categorize } from '../pipeline/categorize.js';
import { validate } from '../pipeline/validate.js';

const text = (row: Record<string, unknown>, names: string[]) => String(names.map((name) => row[name]).find((value) => value !== undefined) ?? '').trim();
const number = (value: string) => { const parsed = Number(value.replace(/[$,]/g, '')); return Number.isFinite(parsed) ? parsed : 0; };
const imageReferences = (row: Record<string, unknown>) => Object.entries(row).filter(([key, value]) => /^image\d*$/i.test(key) && String(value ?? '').trim()).map(([, value]) => String(value).trim());
const findImage = (images: Map<string, any>, reference: string) => {
  const normalized = reference.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
  const basename = normalized.split('/').pop() ?? normalized;
  const exact = images.get(normalized) ?? images.get(basename);
  if (exact) return exact;
  const stem = basename.replace(/\.[^.]+$/, '');
  return [...images.entries()].find(([key]) => key.split('/').pop()?.replace(/\.[^.]+$/, '') === stem)?.[1];
};

export async function processInventoryUpload(job: Job): Promise<void> {
  const { dealerId, dealerName, csvObjectKey, zipObjectKey } = job.data as Record<string, string>;
  const uploadJobId = String((job.data as Record<string, string>).uploadJobId ?? (job.data as Record<string, string>).jobId);
  await UploadJobModel.findByIdAndUpdate(uploadJobId, { status: 'processing' });

  try {
    const { rows, images } = await extract(await downloadObject(csvObjectKey), await downloadObject(zipObjectKey));
    const rejectedRows: any[] = [];
    const seenVins = new Set<string>();
    let validRecords = 0;

    for (const [index, row] of rows.entries()) {
      const rejection = validate(row, index + 2);
      if (rejection) { rejectedRows.push(rejection); continue; }
      const make = text(row, ['make', 'Make']);
      const model = text(row, ['model', 'Model']);
      const year = number(text(row, ['year', 'Year']));
      const vin = text(row, ['vin', 'VIN']);
      const plateNumber = text(row, ['plateNumber', 'plate_number', 'plate', 'Plate Number']);
      const fingerprint = [
        make,
        model,
        year,
        number(text(row, ['price', 'Price'])),
        number(text(row, ['mileage', 'Mileage'])),
        text(row, ['bodyType', 'body_type', 'Body Type']),
        text(row, ['fuelType', 'fuel_type', 'Fuel Type']),
        text(row, ['transmission', 'Transmission']),
        text(row, ['condition', 'Condition']),
        text(row, ['color', 'Color']),
        text(row, ['title', 'Title']),
      ].join('|');
      if (detectDuplicates([vin, plateNumber], fingerprint, seenVins)) {
        rejectedRows.push({ row: index + 2, data: Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? '')])), errors: [vin ? 'Duplicate VIN in upload' : plateNumber ? 'Duplicate plate number in upload' : 'Duplicate vehicle row in upload'] });
        continue;
      }

      const identifierQuery: Array<Record<string, string>> = [];
      if (vin) identifierQuery.push({ vin });
      if (plateNumber) identifierQuery.push({ plateNumber });
      const existingListing = identifierQuery.length ? await ListingModel.findOne({ $or: identifierQuery }).select('_id').lean() : null;
      if (existingListing) {
        rejectedRows.push({ row: index + 2, data: Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? '')])), errors: ['A listing with this VIN or plate number already exists'] });
        continue;
      }

      const jobPrefix = `uploads/${uploadJobId}`;
      const listingImages = [];
      for (const [imageIndex, reference] of imageReferences(row).entries()) {
        const image = findImage(images, reference);
        if (!image) continue;
        const imageKey = `${jobPrefix}/images/${index + 1}-${imageIndex}-${image.originalPath.split('/').pop()}`;
        await uploadObject(imageKey, image.buffer, image.contentType);
        listingImages.push({ id: `${uploadJobId}-${index + 1}-${imageIndex}`, url: `${process.env.S3_PUBLIC_ENDPOINT ?? 'http://localhost:9000'}/${process.env.S3_BUCKET ?? 'motorx'}/${imageKey}`, alt: `${make} ${model}`, isPrimary: imageIndex === 0 });
      }

      const details = enrich(row, make, model, year);
      await ListingModel.create({
        dealerId, dealerName, make, model, year,
        bodyType: categorize(text(row, ['bodyType', 'body_type', 'Body Type'])),
        fuelType: text(row, ['fuelType', 'fuel_type', 'Fuel Type']).toLowerCase() || 'petrol',
        transmission: text(row, ['transmission', 'Transmission']).toLowerCase() || 'automatic',
        condition: text(row, ['condition', 'Condition']).toLowerCase() || 'good',
        mileage: number(text(row, ['mileage', 'Mileage'])), color: text(row, ['color', 'Color']), vin, plateNumber,
        price: number(text(row, ['price', 'Price'])), currency: text(row, ['currency', 'Currency']) || 'USD',
        title: details.title, description: details.description, images: listingImages, status: 'active', views: 0, leads: 0,
        createdAt: new Date(), updatedAt: new Date(), sourceUploadJobId: uploadJobId,
      });
      validRecords += 1;
    }

    const status = rejectedRows.length ? 'completedWithErrors' : 'completed';
    await UploadJobModel.findByIdAndUpdate(uploadJobId, { status, totalRecords: rows.length, processedRecords: rows.length, validRecords, rejectedRecords: rejectedRows.length, rejectedRows, completedAt: new Date() });
    await AuditLogModel.create({ eventType: 'upload_completed', actorId: dealerId, actorName: dealerName || dealerId, targetId: uploadJobId, targetName: 'Inventory batch', details: `ETL completed with ${validRecords} valid and ${rejectedRows.length} rejected rows.` });
  } catch (error) {
    await UploadJobModel.findByIdAndUpdate(uploadJobId, { status: 'failed', errorMessage: error instanceof Error ? error.message : 'ETL processing failed.' });
    throw error;
  }
}
