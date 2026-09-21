import { describe, expect, it } from 'vitest';
import { normalizeInventoryRow } from './normalize.js';

describe('inventory normalization', () => {
  it('normalizes common fields, enums, numbers, and supported price suffixes for a car row', () => {
    const row = normalizeInventoryRow('car', {
      registrationNumber: 'cax-1234', title: '  Reliable SUV ', make: 'TOYOTA', model: 'rav4', year: '2022', price: '25 lakh',
      mileageKm: '12,500', fuelType: ' PETROL ', transmission: 'AUTOMATIC', bodyType: 'SUV', condition: 'Used', location: 'COLOMBO', currency: 'lkr',
    });
    expect(row).toMatchObject({
      registrationNumber: 'CAX-1234', title: 'Reliable SUV', make: 'Toyota', model: 'Rav4', year: 2_022, price: 2_500_000, location: 'Colombo', currency: 'LKR',
      category: 'car', attributes: { fuelType: 'petrol', transmission: 'automatic', bodyType: 'suv', condition: 'used', mileageKm: 12_500 },
    });
  });

  it('normalizes hyphenated and underscored enum aliases the same way', () => {
    const row = normalizeInventoryRow('car', { registrationNumber: 'CAE-1', title: 'EV', make: 'Nissan', model: 'Leaf', year: '2022', price: '1000000', mileageKm: '100', fuelType: 'Plug-in Hybrid', transmission: 'One-Speed Automatic', bodyType: 'Hatch Back', condition: 'Brand New', location: 'Galle' });
    expect(row.attributes).toMatchObject({ fuelType: 'plug_in_hybrid', transmission: 'one_speed_automatic', condition: 'brand_new' });
  });

  it('leaves optional powertrain fields unset when the CSV cell is blank', () => {
    const row = normalizeInventoryRow('car', { registrationNumber: 'CAE-2', title: 'EV', make: 'Nissan', model: 'Leaf', year: '2022', price: '1000000', mileageKm: '100', fuelType: 'electric', transmission: 'automatic', bodyType: 'hatchback', condition: 'used', location: 'Galle', engineCapacityCc: '', batteryCapacityKWh: '40', batteryRangeKm: '270' });
    expect(row.attributes).not.toHaveProperty('engineCapacityCc');
    expect(row.attributes).toMatchObject({ batteryCapacityKWh: 40, batteryRangeKm: 270 });
  });

  it('builds motorcycle-specific attributes instead of car attributes', () => {
    const row = normalizeInventoryRow('motorcycle', { registrationNumber: 'BAX-1', title: 'Bike', make: 'Honda', model: 'CB125F', year: '2021', price: '650000', mileageKm: '8000', fuelType: 'petrol', transmission: 'manual', engineCapacityCc: '125', bikeType: 'Standard', condition: 'used', location: 'Kandy' });
    expect(row.attributes).toMatchObject({ bikeType: 'standard', engineCapacityCc: 125 });
    expect(row.attributes).not.toHaveProperty('bodyType');
  });
});
