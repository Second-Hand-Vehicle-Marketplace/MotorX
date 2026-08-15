import { describe, expect, it } from 'vitest';
import { listInventoryUploadsQuerySchema, listRejectedRecordsQuerySchema, validateInventoryCsv } from './inventory.validation.js';

const carHeaders = 'registrationNumber,title,make,model,year,price,location,fuelType,transmission,bodyType,condition,mileageKm,description\n';

describe('inventory upload validation', () => {
  it('accepts a car CSV containing every required header', () => {
    expect(validateInventoryCsv({ originalname: 'inventory.csv', buffer: Buffer.from(carHeaders) }, 'car')).toEqual({ valid: true });
  });

  it('reports missing required headers for the selected category', () => {
    const result = validateInventoryCsv({ originalname: 'inventory.csv', buffer: Buffer.from('title,make,model\n') }, 'car');
    expect(result.valid).toBe(false);
    expect('message' in result && result.message).toContain('year');
  });

  it('requires different headers for a different category (motorcycle needs bikeType, not bodyType)', () => {
    const result = validateInventoryCsv({ originalname: 'inventory.csv', buffer: Buffer.from(carHeaders) }, 'motorcycle');
    expect(result.valid).toBe(false);
    expect('message' in result && result.message).toContain('bikeType');
  });

  it('rejects non-CSV extensions and binary content', () => {
    expect(validateInventoryCsv({ originalname: 'inventory.txt', buffer: Buffer.from(carHeaders) }, 'car').valid).toBe(false);
    expect(validateInventoryCsv({ originalname: 'inventory.csv', buffer: Buffer.from([0, 1, 2]) }, 'car').valid).toBe(false);
  });

  it('applies bounded history pagination', () => {
    expect(listInventoryUploadsQuerySchema.parse({ page: '2', limit: '50' })).toEqual({ page: 2, limit: 50 });
    expect(listInventoryUploadsQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it('applies bounded rejected-records pagination', () => {
    expect(listRejectedRecordsQuerySchema.parse({ page: '3', limit: '100' })).toEqual({ page: 3, limit: 100 });
    expect(listRejectedRecordsQuerySchema.safeParse({ limit: 201 }).success).toBe(false);
  });
});
