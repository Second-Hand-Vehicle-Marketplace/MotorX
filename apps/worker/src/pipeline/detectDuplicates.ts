import { normalizeRegistrationNumber } from '@motorx/shared-contracts';
import { findActivelyListedRegistrations } from '../repositories/listing.repository.js';
import type { ValidInventoryRow } from './validate.js';

// The registration number is a much stronger identity than title/make/model/year (which two
// genuinely different vehicles of the same trim could share) — it uniquely names one vehicle.
// Scoped globally (not per-dealer): a plate number identifies one physical vehicle regardless
// of which dealer account lists it, matching the manual listing form's duplicate rule.
export function createListingDuplicateKey(row: Pick<ValidInventoryRow, 'registrationNumber'>) { return normalizeRegistrationNumber(row.registrationNumber); }

// Separates unique rows from duplicates found in this upload or in currently listed (draft/active) inventory.
export async function detectExactDuplicates<T extends { data: ValidInventoryRow; rowNumber: number }>(rows: T[], seenKeys: Set<string>) {
  const candidateKeys = rows.map((row) => createListingDuplicateKey(row.data));
  const existingKeys = await findActivelyListedRegistrations(candidateKeys);
  const unique: T[] = []; const duplicates: T[] = [];
  for (const row of rows) { const key = createListingDuplicateKey(row.data); if (seenKeys.has(key) || existingKeys.has(key)) duplicates.push(row); else { seenKeys.add(key); unique.push(row); } }
  return { unique, duplicates };
}
