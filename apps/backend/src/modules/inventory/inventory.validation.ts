import { z } from 'zod';

export const inventoryUploadIdParamsSchema = z.object({ uploadId: z.string().regex(/^[a-f\d]{24}$/i) });
export const listInventoryUploadsQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export type ListInventoryUploadsQuery = z.infer<typeof listInventoryUploadsQuerySchema>;

export const requiredInventoryHeaders = ['title', 'make', 'model', 'year', 'price', 'mileageKm', 'fuelType', 'transmission', 'location'] as const;

// Performs inexpensive structural checks before storing and enqueueing a CSV.
export function validateInventoryCsv(file: Pick<Express.Multer.File, 'originalname' | 'buffer'>) {
  if (!file.originalname.toLowerCase().endsWith('.csv')) return { valid: false, message: 'The inventory file must use the .csv extension.' } as const;
  if (file.buffer.length === 0 || file.buffer.includes(0)) return { valid: false, message: 'The inventory CSV is empty or contains binary data.' } as const;
  const firstLine = file.buffer.subarray(0, Math.min(file.buffer.length, 16_384)).toString('utf8').split(/\r?\n/, 1)[0]?.replace(/^\uFEFF/, '');
  const headers = new Set((firstLine ?? '').split(',').map((header) => header.trim().replace(/^"|"$/g, '')));
  const missing = requiredInventoryHeaders.filter((header) => !headers.has(header));
  return missing.length ? { valid: false, message: `Missing required CSV headers: ${missing.join(', ')}.` } as const : { valid: true } as const;
}
