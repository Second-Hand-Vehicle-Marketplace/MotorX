import { describe, expect, it } from 'vitest';
import { createDealerApplicationSchema, rejectionBodySchema } from './dealer.validation.js';

const validApplication = {
  representativeName: 'Nimal Perera',
  businessName: 'Colombo Auto House',
  registrationNumber: 'pv-12345',
  phone: '0771234567',
  address: '120 Galle Road',
  city: 'Colombo',
  province: 'Western',
  businessPhone: '0112345678',
  businessEmail: 'sales@example.com',
  website: '',
  dealershipType: 'both',
  brands: 'Toyota, Honda, Toyota',
  description: 'A registered dealership specializing in inspected new and used vehicles.',
  inventoryCount: '25',
};

describe('dealer application validation', () => {
  it('normalizes multipart form fields into the dealer application shape', () => {
    expect(createDealerApplicationSchema.parse(validApplication)).toMatchObject({
      registrationNumber: 'PV-12345',
      website: undefined,
      dealershipType: 'both',
      brands: ['Toyota', 'Honda', 'Toyota'],
      inventoryCount: 25,
    });
  });

  it('requires enough information for a meaningful review', () => {
    expect(() => createDealerApplicationSchema.parse({ ...validApplication, description: 'Too short' })).toThrow();
    expect(() => createDealerApplicationSchema.parse({ ...validApplication, businessEmail: 'invalid' })).toThrow();
  });

  it('requires a rejection reason', () => {
    expect(rejectionBodySchema.parse({ reason: 'Registration document is unreadable.' })).toEqual({ reason: 'Registration document is unreadable.' });
    expect(() => rejectionBodySchema.parse({ reason: '' })).toThrow();
  });
});
