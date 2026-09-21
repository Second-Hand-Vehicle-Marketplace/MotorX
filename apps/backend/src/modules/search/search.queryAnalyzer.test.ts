import { describe, expect, it } from 'vitest';
import { analyzeSearchQuery } from './search.queryAnalyzer.js';
import { searchQuerySchema } from './search.validation.js';
import { createLocalSearchEmbedding, normalizeEmbeddingResponse } from '@motorx/shared-contracts';

describe('natural-language search analyzer', () => {
  it('extracts the SRS-style structured query', () => {
    const result = analyzeSearchQuery('affordable automatic SUV under 2 million near Colombo');
    expect(result.filters).toMatchObject({ category: 'car', bodyType: 'suv', transmission: 'automatic', priceMax: 2_000_000, location: 'Colombo' });
    expect(result.intent).toBe('');
  });

  it('corrects common make and model typos', () => {
    const result = analyzeSearchQuery('toyata corola automatic');
    expect(result.filters).toMatchObject({ make: 'Toyota', model: 'Corolla', transmission: 'automatic' });
    expect(result.correctedTerms).toEqual({ toyata: 'toyota', corola: 'corolla' });
  });

  it('distinguishes mileage from price and extracts year ranges', () => {
    expect(analyzeSearchQuery('diesel van under 50000 km after 2019').filters).toMatchObject({ category: 'van', fuelType: 'diesel', mileageMax: 50_000, yearMin: 2019 });
  });
});

describe('search request validation', () => {
  it('bounds query and pagination work', () => {
    expect(searchQuerySchema.parse({ q: 'Toyota near Colombo' })).toMatchObject({ page: 1, limit: 20, sortBy: 'relevance' });
    expect(() => searchQuerySchema.parse({ q: '' })).toThrow();
    expect(() => searchQuerySchema.parse({ q: 'x'.repeat(201) })).toThrow();
    expect(() => searchQuerySchema.parse({ q: 'Toyota', limit: 51 })).toThrow();
  });
});

describe('embedding contract', () => {
  it('keeps local and provider vectors normalized', () => {
    const local = createLocalSearchEmbedding('Toyota hybrid family car');
    expect(local).toHaveLength(384);
    expect(Math.sqrt(local.reduce((sum, value) => sum + value ** 2, 0))).toBeCloseTo(1);
    expect(normalizeEmbeddingResponse([[3, 0], [1, 0]])).toEqual([1, 0]);
  });
});
