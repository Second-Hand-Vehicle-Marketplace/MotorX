import { describe, expect, it } from 'vitest';
import { listInventoryUploadsQuerySchema, validateInventoryCsv } from './inventory.validation.js';

const headers = 'title,make,model,year,price,mileageKm,fuelType,transmission,location,description\n';

describe('inventory upload validation', () => {
  it('accepts a CSV containing every required header', () => {
    expect(validateInventoryCsv({ originalname: 'inventory.csv', buffer: Buffer.from(headers) })).toEqual({ valid: true });
  });

  it('reports missing required headers', () => {
    const result = validateInventoryCsv({ originalname: 'inventory.csv', buffer: Buffer.from('title,make,model\n') });
    expect(result.valid).toBe(false);
    expect('message' in result && result.message).toContain('year');
  });

  it('rejects non-CSV extensions and binary content', () => {
    expect(validateInventoryCsv({ originalname: 'inventory.txt', buffer: Buffer.from(headers) }).valid).toBe(false);
    expect(validateInventoryCsv({ originalname: 'inventory.csv', buffer: Buffer.from([0, 1, 2]) }).valid).toBe(false);
  });

  it('applies bounded history pagination', () => {
    expect(listInventoryUploadsQuerySchema.parse({ page: '2', limit: '50' })).toEqual({ page: 2, limit: 50 });
    expect(listInventoryUploadsQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
