import { describe, expect, it } from 'vitest';
import { validateInventoryRow } from './validate.js';

const commonCarFields = { registrationNumber: 'CAX-1234', title: 'Toyota Corolla', make: 'Toyota', model: 'Corolla', year: 2022, price: 8_000_000, currency: 'LKR', location: 'Colombo' };
const carRow = (attributes: Record<string, unknown>) => ({ ...commonCarFields, category: 'car', attributes: { bodyType: 'sedan', condition: 'used', mileageKm: 20_000, transmission: 'automatic', ...attributes } });

describe('car row validation', () => {
  it('accepts a petrol car with an engine capacity', () => {
    expect(validateInventoryRow(carRow({ fuelType: 'petrol', engineCapacityCc: 1_800 })).valid).toBe(true);
  });

  it('accepts a diesel car with an engine capacity', () => {
    expect(validateInventoryRow(carRow({ fuelType: 'diesel', engineCapacityCc: 2_200 })).valid).toBe(true);
  });

  it('accepts a hybrid car with engine capacity and no battery specs', () => {
    expect(validateInventoryRow(carRow({ fuelType: 'hybrid', engineCapacityCc: 1_800 })).valid).toBe(true);
  });

  it('accepts an electric car with battery specs and no engine capacity', () => {
    expect(validateInventoryRow(carRow({ fuelType: 'electric', batteryCapacityKWh: 40, batteryRangeKm: 270 })).valid).toBe(true);
  });

  it('accepts a plug-in hybrid with both engine capacity and battery specs', () => {
    expect(validateInventoryRow(carRow({ fuelType: 'plug_in_hybrid', engineCapacityCc: 1_600, batteryCapacityKWh: 15, batteryRangeKm: 60 })).valid).toBe(true);
  });

  it('rejects a petrol car missing engine capacity', () => {
    const result = validateInventoryRow(carRow({ fuelType: 'petrol' }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.some((error) => error.includes('engineCapacityCc'))).toBe(true);
  });

  it('rejects an electric car missing battery capacity and range', () => {
    const result = validateInventoryRow(carRow({ fuelType: 'electric' }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((error) => error.includes('batteryCapacityKWh'))).toBe(true);
      expect(result.errors.some((error) => error.includes('batteryRangeKm'))).toBe(true);
    }
  });

  it('rejects an invalid body type', () => {
    const result = validateInventoryRow({ ...commonCarFields, category: 'car', attributes: { bodyType: 'spaceship', condition: 'used', mileageKm: 20_000, fuelType: 'petrol', transmission: 'automatic', engineCapacityCc: 1_800 } });
    expect(result.valid).toBe(false);
  });

  it('returns multiple field-level errors for a broadly invalid row', () => {
    const result = validateInventoryRow({ ...commonCarFields, year: 1800, price: Number.NaN, category: 'car', attributes: { bodyType: 'sedan', condition: 'used', mileageKm: 20_000, fuelType: 'steam', transmission: 'automatic' } });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('other category row validation', () => {
  const common = { registrationNumber: 'BAX-1', title: 'Vehicle', make: 'Make', model: 'Model', year: 2021, price: 500_000, currency: 'LKR', location: 'Kandy' };

  it('accepts a valid motorcycle', () => {
    expect(validateInventoryRow({ ...common, category: 'motorcycle', attributes: { condition: 'used', mileageKm: 8_000, fuelType: 'petrol', transmission: 'manual', engineCapacityCc: 125, bikeType: 'standard' } }).valid).toBe(true);
  });

  it('rejects a motorcycle with an invalid bikeType', () => {
    expect(validateInventoryRow({ ...common, category: 'motorcycle', attributes: { condition: 'used', mileageKm: 8_000, fuelType: 'petrol', transmission: 'manual', engineCapacityCc: 125, bikeType: 'hovercraft' } }).valid).toBe(false);
  });

  it('accepts a valid van', () => {
    expect(validateInventoryRow({ ...common, category: 'van', attributes: { condition: 'used', mileageKm: 120_000, fuelType: 'diesel', transmission: 'manual', engineCapacityCc: 2_700, seatingCapacity: 15 } }).valid).toBe(true);
  });

  it('accepts a valid truck', () => {
    expect(validateInventoryRow({ ...common, category: 'truck', attributes: { condition: 'used', mileageKm: 210_000, fuelType: 'diesel', transmission: 'manual', engineCapacityCc: 4_000, payloadCapacityKg: 3_000 } }).valid).toBe(true);
  });

  it('rejects a truck missing engine capacity for a combustion fuel type', () => {
    expect(validateInventoryRow({ ...common, category: 'truck', attributes: { condition: 'used', mileageKm: 210_000, fuelType: 'diesel', transmission: 'manual' } }).valid).toBe(false);
  });

  it('accepts a valid three-wheeler', () => {
    expect(validateInventoryRow({ ...common, category: 'three_wheeler', attributes: { condition: 'used', mileageKm: 55_000, fuelType: 'petrol', transmission: 'manual', engineCapacityCc: 200 } }).valid).toBe(true);
  });

  it('accepts an electric three-wheeler without engine capacity', () => {
    expect(validateInventoryRow({ ...common, category: 'three_wheeler', attributes: { condition: 'used', mileageKm: 30_000, fuelType: 'electric', transmission: 'automatic', batteryCapacityKWh: 8, batteryRangeKm: 80 } }).valid).toBe(true);
  });

  it('accepts a valid bus', () => {
    expect(validateInventoryRow({ ...common, category: 'bus', attributes: { condition: 'used', mileageKm: 350_000, fuelType: 'diesel', transmission: 'manual', engineCapacityCc: 5_700, seatingCapacity: 52 } }).valid).toBe(true);
  });
});
