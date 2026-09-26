// How alike two vehicles are, for "Similar vehicles" and "Recommended for you". A plain weighted
// score rather than a trained model: every point can be explained ("same make", "similar price"),
// it needs no stored buyer profile, and it works from the first listing in the marketplace.
export interface ComparableVehicle {
  category: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location: string;
  attributes?: Record<string, unknown>;
}

const same = (a: unknown, b: unknown) => typeof a === 'string' && typeof b === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase();
const closeness = (difference: number, range: number) => Math.max(0, 1 - Math.abs(difference) / range);
const town = (location: string) => location.split(',')[0]!.trim().toLowerCase();

export function similarityScore(seed: ComparableVehicle, candidate: ComparableVehicle): number {
  const seedAttributes = seed.attributes ?? {};
  const candidateAttributes = candidate.attributes ?? {};
  let score = 0;
  if (seed.category === candidate.category) score += 2;
  if (same(seed.make, candidate.make)) {
    score += 3;
    if (same(seed.model, candidate.model)) score += 3;
  }
  if (same(seedAttributes.bodyType, candidateAttributes.bodyType)) score += 1.5;
  if (same(seedAttributes.fuelType, candidateAttributes.fuelType)) score += 1;
  if (same(seedAttributes.transmission, candidateAttributes.transmission)) score += 0.5;
  // Full marks at the same price, nothing at 50% dearer or cheaper.
  score += 2.5 * closeness((candidate.price - seed.price) / Math.max(seed.price, 1), 0.5);
  // Full marks for the same year, nothing at six years apart.
  score += closeness(candidate.year - seed.year, 6);
  const seedMileage = seedAttributes.mileageKm; const candidateMileage = candidateAttributes.mileageKm;
  if (typeof seedMileage === 'number' && typeof candidateMileage === 'number') score += 0.5 * closeness(candidateMileage - seedMileage, Math.max(seedMileage, 20_000));
  if (town(seed.location) === town(candidate.location)) score += 0.5;
  return score;
}

// Recently viewed vehicles count more than older ones: the latest has weight 1, then 0.85, 0.72...
export function profileScore(seeds: ComparableVehicle[], candidate: ComparableVehicle): number {
  let total = 0; let weights = 0;
  seeds.forEach((seed, index) => { const weight = 0.85 ** index; total += weight * similarityScore(seed, candidate); weights += weight; });
  return weights ? total / weights : 0;
}

// Highest score first; equal scores keep the newer listing first (candidates arrive newest first).
export function rankByScore<T>(candidates: T[], score: (candidate: T) => number, limit: number): T[] {
  return candidates.map((candidate, index) => ({ candidate, index, value: score(candidate) }))
    .sort((a, b) => b.value - a.value || a.index - b.index)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
