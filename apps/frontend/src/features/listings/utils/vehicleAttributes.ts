import type { Listing } from '../types/listing.types';

// `listing.attributes` is a discriminated union (CarAttributes | MotorcycleAttributes | ... |
// OtherVehicleAttributes) — most fields exist on every category except 'other', so these
// helpers read them safely instead of every page repeating the same `'key' in attributes` guard.
type AnyAttributes = Listing['attributes'];

export function getMileageKm(listing: Listing): number | undefined {
  return 'mileageKm' in listing.attributes ? (listing.attributes as AnyAttributes & { mileageKm?: number }).mileageKm : undefined;
}

export function getFuelType(listing: Listing): string | undefined {
  return 'fuelType' in listing.attributes ? (listing.attributes as AnyAttributes & { fuelType?: string }).fuelType : undefined;
}

export function getTransmission(listing: Listing): string | undefined {
  return 'transmission' in listing.attributes ? (listing.attributes as AnyAttributes & { transmission?: string }).transmission : undefined;
}

export function getCondition(listing: Listing): string | undefined {
  return 'condition' in listing.attributes ? (listing.attributes as AnyAttributes & { condition?: string }).condition : undefined;
}

export function getEdition(listing: Listing): string | undefined {
  return 'edition' in listing.attributes ? (listing.attributes as AnyAttributes & { edition?: string }).edition : undefined;
}

export function getEngineCapacityCc(listing: Listing): number | undefined {
  return 'engineCapacityCc' in listing.attributes ? (listing.attributes as AnyAttributes & { engineCapacityCc?: number }).engineCapacityCc : undefined;
}

export function getBatteryCapacityKWh(listing: Listing): number | undefined {
  return 'batteryCapacityKWh' in listing.attributes ? (listing.attributes as AnyAttributes & { batteryCapacityKWh?: number }).batteryCapacityKWh : undefined;
}

export function getBatteryRangeKm(listing: Listing): number | undefined {
  return 'batteryRangeKm' in listing.attributes ? (listing.attributes as AnyAttributes & { batteryRangeKm?: number }).batteryRangeKm : undefined;
}

export function getBodyType(listing: Listing): string | undefined {
  return listing.category === 'car' ? listing.attributes.bodyType : undefined;
}

// Human-readable label for a snake_case enum value, e.g. "plug_in_hybrid" -> "Plug in hybrid".
export function formatEnumLabel(value?: string): string {
  if (!value) return '—';
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
