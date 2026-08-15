import type { ExtractedInventoryRow } from './extract.js';

export interface NormalizedInventoryRow {
  title: string; make: string; model: string; year: number; price: number; currency: string;
  mileageKm: number; fuelType: string; transmission: string; location: string; description?: string;
}

// Converts supported plain, million, and lakh price representations into numbers.
function normalizeNumber(value: string) {
  const compact = value.trim().toLowerCase().replace(/[,\s]/g, '');
  if (!compact) return Number.NaN;
  const multiplier = compact.endsWith('lakh') ? 100_000 : compact.endsWith('m') ? 1_000_000 : compact.endsWith('k') ? 1_000 : 1;
  return Number(compact.replace(/lakh$|m$|k$/i, '')) * multiplier;
}

// Produces consistent title case for searchable names and locations.
function titleCase(value: string) { return value.trim().toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase()); }

// Normalizes common CSV aliases into the listing model's supported enum values.
function normalizeEnum(value: string) { return value.trim().toLowerCase().replace(/[\s_]+/g, '-'); }

// Converts one extracted CSV row into a deterministic internal representation.
export function normalizeInventoryRow(row: ExtractedInventoryRow): NormalizedInventoryRow {
  const description = row.description?.trim();
  return {
    title: row.title?.trim() ?? '', make: titleCase(row.make ?? ''), model: titleCase(row.model ?? ''),
    year: normalizeNumber(row.year ?? ''), price: normalizeNumber(row.price ?? ''),
    currency: (row.currency?.trim() || 'LKR').toUpperCase(), mileageKm: normalizeNumber(row.mileageKm ?? ''),
    fuelType: normalizeEnum(row.fuelType ?? ''), transmission: normalizeEnum(row.transmission ?? ''),
    location: titleCase(row.location ?? ''), ...(description ? { description } : {}),
  };
}
