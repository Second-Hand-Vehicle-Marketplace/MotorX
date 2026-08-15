import { describe, expect, it } from 'vitest';
import { normalizeInventoryRow } from './normalize.js';

describe('inventory normalization', () => {
  it('normalizes text, enums, numbers, and supported price suffixes', () => {
    const row = normalizeInventoryRow({ title: '  Reliable SUV ', make: 'TOYOTA', model: 'rav4', year: '2022', price: '25 lakh', mileageKm: '12,500', fuelType: ' PETROL ', transmission: 'AUTOMATIC', location: 'COLOMBO', currency: 'lkr' });
    expect(row).toMatchObject({ title: 'Reliable SUV', make: 'Toyota', model: 'Rav4', year: 2022, price: 2_500_000, mileageKm: 12_500, fuelType: 'petrol', transmission: 'automatic', location: 'Colombo', currency: 'LKR' });
  });
});
