import { describe, expect, it } from 'vitest';
import { profileScore, rankByScore, similarityScore, type ComparableVehicle } from './buyer.similarity.js';

const aqua: ComparableVehicle = { category: 'car', make: 'Toyota', model: 'Aqua', year: 2018, price: 6_000_000, location: 'Colombo', attributes: { bodyType: 'hatchback', fuelType: 'hybrid', transmission: 'automatic', mileageKm: 60_000 } };
const vary = (changes: Partial<ComparableVehicle>): ComparableVehicle => ({ ...aqua, ...changes });

describe('vehicle similarity', () => {
  it('scores the same model above the same make above another make', () => {
    const sameModel = similarityScore(aqua, vary({ year: 2017 }));
    const sameMake = similarityScore(aqua, vary({ model: 'Prius' }));
    const otherMake = similarityScore(aqua, vary({ make: 'Honda', model: 'Fit' }));
    expect(sameModel).toBeGreaterThan(sameMake);
    expect(sameMake).toBeGreaterThan(otherMake);
  });

  it('prefers a closer price and year', () => {
    expect(similarityScore(aqua, vary({ price: 6_300_000 }))).toBeGreaterThan(similarityScore(aqua, vary({ price: 8_500_000 })));
    expect(similarityScore(aqua, vary({ year: 2019 }))).toBeGreaterThan(similarityScore(aqua, vary({ year: 2012 })));
  });

  it('ignores letter case and spacing in makes, and compares the town part of a location', () => {
    expect(similarityScore(aqua, vary({ make: ' toyota ', location: 'Colombo, Western' }))).toBe(similarityScore(aqua, aqua));
  });

  it('weights the most recently viewed vehicle more than older views', () => {
    const suv = vary({ make: 'Honda', model: 'Vezel', attributes: { bodyType: 'suv' } });
    const recentSuv = profileScore([suv, aqua], vary({ make: 'Honda', model: 'Vezel', attributes: { bodyType: 'suv' } }));
    const recentAqua = profileScore([aqua, suv], vary({ make: 'Honda', model: 'Vezel', attributes: { bodyType: 'suv' } }));
    expect(recentSuv).toBeGreaterThan(recentAqua);
  });

  it('keeps the original (newest first) order for equal scores', () => {
    expect(rankByScore(['a', 'b', 'c'], () => 1, 2)).toEqual(['a', 'b']);
    expect(rankByScore([1, 3, 2], (value) => value, 3)).toEqual([3, 2, 1]);
  });
});
