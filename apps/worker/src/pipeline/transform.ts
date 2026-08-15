import type { ExtractedInventoryRow } from './extract.js';
import { normalizeInventoryRow } from './normalize.js';
import { validateInventoryRow, type ValidInventoryRow } from './validate.js';

export interface PreparedInventoryRow { data: ValidInventoryRow; originalData: ExtractedInventoryRow; rowNumber: number }
export interface InvalidInventoryRow { originalData: ExtractedInventoryRow; rowNumber: number; errors: string[] }

// Normalizes and validates a batch while preserving source rows for correction reports.
export function prepareInventoryBatch(rows: ExtractedInventoryRow[], firstRowNumber: number) {
  const valid: PreparedInventoryRow[] = []; const invalid: InvalidInventoryRow[] = [];
  rows.forEach((originalData, index) => {
    const rowNumber = firstRowNumber + index; const result = validateInventoryRow(normalizeInventoryRow(originalData));
    if (result.valid) valid.push({ data: result.data, originalData, rowNumber });
    else invalid.push({ originalData, rowNumber, errors: result.errors });
  });
  return { valid, invalid };
}
