import { describe, expect, it } from 'vitest';
import { prepareInventoryBatch } from './transform.js';

describe('inventory batch transformation', () => {
  it('separates valid and invalid rows while retaining CSV row numbers', () => {
    const result = prepareInventoryBatch([
      { title: 'Toyota Corolla', make: 'Toyota', model: 'Corolla', year: '2022', price: '8000000', mileageKm: '20000', fuelType: 'petrol', transmission: 'automatic', location: 'Colombo' },
      { title: '', make: '', model: '', year: 'bad', price: '-1', mileageKm: '-2', fuelType: 'steam', transmission: 'unknown', location: '' },
    ], 2);
    expect(result.valid[0]?.rowNumber).toBe(2); expect(result.invalid[0]?.rowNumber).toBe(3); expect(result.invalid[0]?.errors.length).toBeGreaterThan(1);
  });
});
