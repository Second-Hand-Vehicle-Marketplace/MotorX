// Normalizes a vehicle registration/license plate number into a comparable identity key.
// "CAX-1234", "CAX 1234", and "cax1234" all normalize to "CAX1234".
export function normalizeRegistrationNumber(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, '');
}
