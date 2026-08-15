import type { Types } from 'mongoose';
import { findExistingListingCandidates } from '../repositories/listing.repository.js';
import type { ValidInventoryRow } from './validate.js';

// Builds the exact-match identity used consistently for CSV and database checks.
export function createListingDuplicateKey(row: Pick<ValidInventoryRow, 'title' | 'make' | 'model' | 'year'>) { return `${row.title}|${row.make}|${row.model}|${row.year}`.toLowerCase(); }

// Separates unique rows from duplicates found in this upload or existing inventory.
export async function detectExactDuplicates<T extends { data: ValidInventoryRow; rowNumber: number }>(dealerId: Types.ObjectId, rows: T[], seenKeys: Set<string>) {
  const existing = await findExistingListingCandidates(dealerId, rows.map((row) => row.data));
  const existingKeys = new Set(existing.map((row: any) => createListingDuplicateKey(row)));
  const unique: T[] = []; const duplicates: T[] = [];
  for (const row of rows) { const key = createListingDuplicateKey(row.data); if (seenKeys.has(key) || existingKeys.has(key)) duplicates.push(row); else { seenKeys.add(key); unique.push(row); } }
  return { unique, duplicates };
}
