import { z } from 'zod';
import { vehicleCategories, type VehicleCategory } from '@motorx/shared-contracts';

export const inventoryUploadIdParamsSchema = z.object({ uploadId: z.string().regex(/^[a-f\d]{24}$/i) });
export const listInventoryUploadsQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export type ListInventoryUploadsQuery = z.infer<typeof listInventoryUploadsQuerySchema>;

export const listRejectedRecordsQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(200).default(50) });
export type ListRejectedRecordsQuery = z.infer<typeof listRejectedRecordsQuerySchema>;

export const uploadCategoryBodySchema = z.object({ category: z.enum(vehicleCategories) });
export const csvTemplateParamsSchema = z.object({ category: z.enum(vehicleCategories) });

const commonRequiredHeaders = ['registrationNumber', 'title', 'make', 'model', 'year', 'price', 'location'] as const;

// Headers that must be present in the CSV for each category. Only structurally-required columns
// are listed here — conditionally-required ones (engineCapacityCc/battery fields, which depend on
// each row's own fuelType) are still enforced per-row by the shared Zod schema during ETL.
const requiredHeadersByCategory: Record<VehicleCategory, readonly string[]> = {
  car: [...commonRequiredHeaders, 'fuelType', 'transmission', 'bodyType', 'condition', 'mileageKm'],
  motorcycle: [...commonRequiredHeaders, 'fuelType', 'transmission', 'bikeType', 'condition', 'mileageKm'],
  van: [...commonRequiredHeaders, 'fuelType', 'transmission', 'condition', 'mileageKm'],
  truck: [...commonRequiredHeaders, 'fuelType', 'transmission', 'condition', 'mileageKm'],
  three_wheeler: [...commonRequiredHeaders, 'fuelType', 'transmission', 'condition', 'mileageKm'],
  bus: [...commonRequiredHeaders, 'fuelType', 'transmission', 'condition', 'mileageKm'],
  other: [...commonRequiredHeaders],
};

// Performs inexpensive structural checks before storing and enqueueing a CSV.
export function validateInventoryCsv(file: Pick<Express.Multer.File, 'originalname' | 'buffer'>, category: VehicleCategory) {
  if (!file.originalname.toLowerCase().endsWith('.csv')) return { valid: false, message: 'The inventory file must use the .csv extension.' } as const;
  if (file.buffer.length === 0 || file.buffer.includes(0)) return { valid: false, message: 'The inventory CSV is empty or contains binary data.' } as const;
  const firstLine = file.buffer.subarray(0, Math.min(file.buffer.length, 16_384)).toString('utf8').split(/\r?\n/, 1)[0]?.replace(/^﻿/, '');
  const headers = new Set((firstLine ?? '').split(',').map((header) => header.trim().replace(/^"|"$/g, '')));
  const missing = requiredHeadersByCategory[category].filter((header) => !headers.has(header));
  return missing.length ? { valid: false, message: `Missing required CSV headers for ${category}: ${missing.join(', ')}.` } as const : { valid: true } as const;
}

// Zip's local-file-header signature ("PK\x03\x04") — also matches an empty archive's
// end-of-central-directory signature ("PK\x05\x06") so an intentionally empty zip isn't rejected.
function hasZipSignature(buffer: Buffer) {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4b && ((buffer[2] === 0x03 && buffer[3] === 0x04) || (buffer[2] === 0x05 && buffer[3] === 0x06));
}

// Performs inexpensive structural checks before storing and enqueueing a vehicle-photos zip.
export function validateInventoryImagesZip(file: Pick<Express.Multer.File, 'originalname' | 'buffer'>) {
  if (!file.originalname.toLowerCase().endsWith('.zip')) return { valid: false, message: 'The vehicle photos file must use the .zip extension.' } as const;
  if (!hasZipSignature(file.buffer)) return { valid: false, message: 'The uploaded file is not a valid zip archive.' } as const;
  return { valid: true } as const;
}
