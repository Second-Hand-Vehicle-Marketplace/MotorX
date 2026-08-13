import { describe, expect, it } from 'vitest';
import { listListingsQuerySchema, reorderListingImagesBodySchema, updateListingBodySchema, updateListingStatusBodySchema } from './listing.validation.js';

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
