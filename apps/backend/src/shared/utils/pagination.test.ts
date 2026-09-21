import { describe, expect, it } from 'vitest';
import { buildPaginationMeta } from './pagination.js';

describe('buildPaginationMeta', () => {
  it('calculates the final partial page', () => {
    expect(buildPaginationMeta(2, 20, 41)).toEqual({ page: 2, limit: 20, total: 41, totalPages: 3 });
  });

  it('returns zero pages for an empty collection', () => {
    expect(buildPaginationMeta(1, 20, 0).totalPages).toBe(0);
  });
});
