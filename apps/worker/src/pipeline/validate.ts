import { listingRowSchema, type ListingRowInput } from '@motorx/shared-contracts';

export type ValidInventoryRow = ListingRowInput;

// Validates one normalized CSV row against the same category-discriminated schema
// (common fields + conditional fuel-type rules) the backend's manual listing form uses.
export function validateInventoryRow(row: unknown): { valid: true; data: ValidInventoryRow } | { valid: false; errors: string[] } {
  const result = listingRowSchema.safeParse(row);
  if (result.success) return { valid: true, data: result.data };
  return { valid: false, errors: result.error.issues.map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`) };
}
