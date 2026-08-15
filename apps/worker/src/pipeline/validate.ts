import { z } from 'zod';
import type { NormalizedInventoryRow } from './normalize.js';

const currentYear = new Date().getFullYear();
const inventoryRowSchema = z.object({
  title: z.string().min(3).max(160), make: z.string().min(1).max(80), model: z.string().min(1).max(80),
  year: z.number().int().min(1900).max(currentYear + 1), price: z.number().finite().nonnegative(),
  currency: z.string().length(3), mileageKm: z.number().finite().nonnegative(),
  fuelType: z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'other']),
  transmission: z.enum(['automatic', 'manual', 'other']), location: z.string().min(2).max(120),
  description: z.string().max(5_000).optional(),
});

export type ValidInventoryRow = z.infer<typeof inventoryRowSchema>;

// Returns field-specific validation errors without throwing away other valid rows.
export function validateInventoryRow(row: NormalizedInventoryRow): { valid: true; data: ValidInventoryRow } | { valid: false; errors: string[] } {
  const result = inventoryRowSchema.safeParse(row);
  if (result.success) return { valid: true, data: result.data };
  return { valid: false, errors: result.error.issues.map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`) };
}
