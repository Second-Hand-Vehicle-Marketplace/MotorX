import { describe, expect, it } from 'vitest';
import { normalizeRegistrationNumber } from '@motorx/shared-contracts';
import { createListingBodySchema, listListingsQuerySchema, reorderListingImagesBodySchema, updateListingBodySchema, updateListingStatusBodySchema } from './listing.validation.js';

describe('registration number normalization', () => {
  it('normalizes hyphens, spaces, and casing to the same identity', () => {
    expect(normalizeRegistrationNumber('CAX-1234')).toBe('CAX1234');
    expect(normalizeRegistrationNumber('CAX 1234')).toBe('CAX1234');
    expect(normalizeRegistrationNumber('cax1234')).toBe('CAX1234');
  });
});

const commonCarFields = { registrationNumber: 'CAX-1234', title: 'Toyota Corolla 2020', make: 'Toyota', model: 'Corolla', year: 2020, price: 8_500_000, location: 'Colombo' };

describe('listing request validation', () => {
  it('applies safe pagination defaults', () => {
    expect(listListingsQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
  });

  it('rejects pagination outside its allowed range', () => {
    expect(() => listListingsQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => listListingsQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it('requires at least one field when updating a listing', () => {
    expect(() => updateListingBodySchema.parse({})).toThrow();
    expect(updateListingBodySchema.parse({ price: 8_500_000 })).toEqual({ price: 8_500_000 });
  });

  it('only accepts statuses controlled by the dealer workflow', () => {
    expect(updateListingStatusBodySchema.parse({ status: 'sold' })).toEqual({ status: 'sold' });
    expect(() => updateListingStatusBodySchema.parse({ status: 'draft' })).toThrow();
  });

  it('requires at least one image key when reordering', () => {
    expect(reorderListingImagesBodySchema.parse({ imageKeys: ['first.jpg'] })).toEqual({ imageKeys: ['first.jpg'] });
    expect(() => reorderListingImagesBodySchema.parse({ imageKeys: [] })).toThrow();
  });
});

describe('create listing category validation', () => {
  it('accepts a petrol car with engine capacity', () => {
    const result = createListingBodySchema.safeParse({ ...commonCarFields, category: 'car', attributes: { bodyType: 'sedan', condition: 'used', mileageKm: 45_000, fuelType: 'petrol', transmission: 'automatic', engineCapacityCc: 1_800 } });
    expect(result.success).toBe(true);
  });

  it('rejects an electric car missing battery capacity/range', () => {
    const result = createListingBodySchema.safeParse({ ...commonCarFields, category: 'car', attributes: { bodyType: 'hatchback', condition: 'used', mileageKm: 32_000, fuelType: 'electric', transmission: 'one_speed_automatic' } });
    expect(result.success).toBe(false);
  });

  it('rejects a petrol/diesel car missing engine capacity', () => {
    const result = createListingBodySchema.safeParse({ ...commonCarFields, category: 'car', attributes: { bodyType: 'sedan', condition: 'used', mileageKm: 45_000, fuelType: 'diesel', transmission: 'manual' } });
    expect(result.success).toBe(false);
  });

  it('rejects a listing whose attributes belong to the wrong category', () => {
    const result = createListingBodySchema.safeParse({ ...commonCarFields, category: 'car', attributes: { bikeType: 'standard', condition: 'used', mileageKm: 8_000, fuelType: 'petrol', transmission: 'manual', engineCapacityCc: 125 } });
    expect(result.success).toBe(false);
  });

  it('requires a registration number', () => {
    const { registrationNumber, ...withoutRegistration } = commonCarFields;
    const result = createListingBodySchema.safeParse({ ...withoutRegistration, category: 'car', attributes: { bodyType: 'sedan', condition: 'used', mileageKm: 45_000, fuelType: 'petrol', transmission: 'automatic', engineCapacityCc: 1_800 } });
    expect(result.success).toBe(false);
  });
});
