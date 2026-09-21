import type { VehicleCategory } from '@motorx/shared-contracts';
import type { ExtractedInventoryRow } from './extract.js';

// Converts supported plain, million, and lakh number representations into a JS number.
// Returns undefined for blank cells so optional fields (e.g. battery specs on a petrol car)
// stay unset instead of failing validation as NaN.
function normalizeNumber(value?: string): number | undefined {
  const compact = (value ?? '').trim().toLowerCase().replace(/[,\s]/g, '');
  if (!compact) return undefined;
  const multiplier = compact.endsWith('lakh') ? 100_000 : compact.endsWith('m') ? 1_000_000 : compact.endsWith('k') ? 1_000 : 1;
  const parsed = Number(compact.replace(/lakh$|m$|k$/i, ''));
  return Number.isNaN(parsed) ? undefined : parsed * multiplier;
}

// Produces consistent title case for searchable names and locations.
function titleCase(value: string) { return value.trim().toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase()); }

// Normalizes CSV enum aliases into the snake_case values used across vehicleCategories,
// fuelTypes, transmissionTypes, vehicleConditions, carBodyTypes, and motorcycleTypes —
// "Plug-in Hybrid" / "plug in hybrid" / "PLUG_IN_HYBRID" all resolve to "plug_in_hybrid".
function normalizeEnumValue(value?: string) { return (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_'); }

// Common fields shared by every category's CSV row.
export function normalizeCommonFields(row: ExtractedInventoryRow) {
  const description = row.description?.trim();
  return {
    registrationNumber: (row.registrationNumber ?? '').trim().toUpperCase(),
    title: (row.title ?? '').trim(),
    make: titleCase(row.make ?? ''),
    model: titleCase(row.model ?? ''),
    year: normalizeNumber(row.year),
    price: normalizeNumber(row.price),
    currency: (row.currency?.trim() || 'LKR').toUpperCase(),
    location: titleCase(row.location ?? ''),
    ...(description ? { description } : {}),
  };
}

function pickNumber(key: string, raw?: string): Record<string, number> { const value = normalizeNumber(raw); return value === undefined ? {} : { [key]: value }; }

function normalizePowertrainAttributes(row: ExtractedInventoryRow) {
  return {
    fuelType: normalizeEnumValue(row.fuelType),
    transmission: normalizeEnumValue(row.transmission),
    ...pickNumber('engineCapacityCc', row.engineCapacityCc),
    ...pickNumber('batteryCapacityKWh', row.batteryCapacityKWh),
    ...pickNumber('batteryRangeKm', row.batteryRangeKm),
  };
}

// Builds the category-specific `attributes` object for one CSV row. Unrecognized/irrelevant
// columns for the selected category are simply not read — the CSV template only includes the
// columns that apply, but stray extra columns from a hand-edited file are harmlessly ignored.
export function normalizeAttributes(category: VehicleCategory, row: ExtractedInventoryRow): Record<string, unknown> {
  const powertrain = normalizePowertrainAttributes(row);
  const edition = row.edition?.trim();
  const condition = normalizeEnumValue(row.condition);
  const mileage = pickNumber('mileageKm', row.mileageKm);
  switch (category) {
    case 'car':
      return { ...powertrain, ...(edition ? { edition } : {}), bodyType: normalizeEnumValue(row.bodyType), condition, ...mileage };
    case 'motorcycle':
      return { ...powertrain, ...(edition ? { edition } : {}), condition, ...mileage, bikeType: normalizeEnumValue(row.bikeType) };
    case 'van':
      return { ...powertrain, ...(edition ? { edition } : {}), condition, ...mileage, ...pickNumber('seatingCapacity', row.seatingCapacity) };
    case 'truck':
      return { ...powertrain, ...(edition ? { edition } : {}), condition, ...mileage, ...pickNumber('payloadCapacityKg', row.payloadCapacityKg) };
    case 'bus':
      return { ...powertrain, condition, ...mileage, ...pickNumber('seatingCapacity', row.seatingCapacity) };
    case 'three_wheeler':
      return { ...powertrain, condition, ...mileage };
    default:
      return { ...(condition ? { condition } : {}), ...mileage };
  }
}

// Converts one extracted CSV row into the shape listingRowSchema (from @motorx/shared-contracts)
// validates: common fields at the top level, plus the category-discriminated attributes object.
export function normalizeInventoryRow(category: VehicleCategory, row: ExtractedInventoryRow) {
  return { ...normalizeCommonFields(row), category, attributes: normalizeAttributes(category, row) };
}
