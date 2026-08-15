import { describe, expect, it } from 'vitest';
import { validateInventoryRow } from './validate.js';

const validRow = { title: 'Toyota Corolla', make: 'Toyota', model: 'Corolla', year: 2022, price: 8_000_000, currency: 'LKR', mileageKm: 20_000, fuelType: 'petrol', transmission: 'automatic', location: 'Colombo' };

describe('inventory row validation', () => {
  it('accepts a complete normalized row', () => { expect(validateInventoryRow(validRow).valid).toBe(true); });
  it('returns multiple field-level errors for an invalid row', () => { const result = validateInventoryRow({ ...validRow, year: 1800, price: Number.NaN, fuelType: 'steam' }); expect(result.valid).toBe(false); if (!result.valid) expect(result.errors.length).toBeGreaterThanOrEqual(3); });
});
