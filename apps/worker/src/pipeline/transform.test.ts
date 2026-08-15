import { describe, expect, it } from 'vitest';
import { prepareInventoryBatch } from './transform.js';

describe('inventory batch transformation', () => {
  it('separates valid and invalid rows while retaining CSV row numbers', () => {
    const result = prepareInventoryBatch('car', [
      { registrationNumber: 'CAX-1234', title: 'Toyota Corolla', make: 'Toyota', model: 'Corolla', year: '2022', price: '8000000', mileageKm: '20000', fuelType: 'petrol', transmission: 'automatic', bodyType: 'sedan', condition: 'used', engineCapacityCc: '1800', location: 'Colombo' },
      { registrationNumber: '', title: '', make: '', model: '', year: 'bad', price: '-1', mileageKm: '-2', fuelType: 'steam', transmission: 'unknown', bodyType: 'spaceship', condition: 'used', location: '' },
    ], 2);
    expect(result.valid[0]?.rowNumber).toBe(2); expect(result.invalid[0]?.rowNumber).toBe(3); expect(result.invalid[0]?.errors.length).toBeGreaterThan(1);
  });

  it('validates a full electric-car CSV row example end to end', () => {
    const result = prepareInventoryBatch('car', [
      { registrationNumber: 'CAE-5678', title: 'Nissan Leaf 2022', make: 'Nissan', model: 'Leaf', edition: 'G', bodyType: 'hatchback', year: '2022', condition: 'used', price: '12500000', currency: 'LKR', mileageKm: '32000', fuelType: 'electric', transmission: 'one_speed_automatic', engineCapacityCc: '', batteryCapacityKWh: '40', batteryRangeKm: '270', location: 'Colombo', description: 'Good condition' },
    ], 2);
    expect(result.invalid).toHaveLength(0);
    expect(result.valid[0]?.data.attributes).toMatchObject({ batteryCapacityKWh: 40, batteryRangeKm: 270 });
  });

  it('rejects a mixed batch by row without discarding the valid rows in it', () => {
    const result = prepareInventoryBatch('car', [
      { registrationNumber: 'CAX-0001', title: 'Valid Car', make: 'Toyota', model: 'Aqua', year: '2019', price: '3000000', mileageKm: '60000', fuelType: 'hybrid', transmission: 'automatic', bodyType: 'hatchback', condition: 'used', engineCapacityCc: '1500', location: 'Colombo' },
      { registrationNumber: 'CAX-0002', title: 'Missing Engine', make: 'Toyota', model: 'Aqua', year: '2019', price: '3000000', mileageKm: '60000', fuelType: 'petrol', transmission: 'automatic', bodyType: 'hatchback', condition: 'used', location: 'Colombo' },
    ], 2);
    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0]?.rowNumber).toBe(3);
  });
});
