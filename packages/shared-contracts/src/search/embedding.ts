export const SEARCH_EMBEDDING_DIMENSIONS = 384;

function hashToken(token: string) {
  let hash = 2166136261;
  for (const character of token) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function normalize(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map((value) => value / magnitude);
}

// Provides an offline, model-compatible dimension fallback based on token features.
export function createLocalSearchEmbedding(text: string) {
  const values = new Array<number>(SEARCH_EMBEDDING_DIMENSIONS).fill(0);
  const tokens = text.toLocaleLowerCase('en').match(/[a-z0-9]+/g) ?? [];
  for (const token of tokens) {
    const hash = hashToken(token);
    values[hash % values.length] += hash & 1 ? 1 : -1;
  }
  return normalize(values);
}

// HF feature extraction can return one vector or one vector per token; both become one normalized vector.
export function normalizeEmbeddingResponse(payload: unknown): number[] {
  if (!Array.isArray(payload) || payload.length === 0) throw new Error('The embedding provider returned an empty response.');
  if (payload.every((value) => typeof value === 'number')) return normalize(payload as number[]);
  if (payload.every((value) => Array.isArray(value) && value.every((entry) => typeof entry === 'number'))) {
    const rows = payload as number[][];
    const dimensions = rows[0]?.length ?? 0;
    if (!dimensions || rows.some((row) => row.length !== dimensions)) throw new Error('The embedding provider returned inconsistent dimensions.');
    return normalize(Array.from({ length: dimensions }, (_, index) => rows.reduce((sum, row) => sum + row[index], 0) / rows.length));
  }
  throw new Error('The embedding provider returned an unsupported response shape.');
}

export function composeListingSearchText(listing: { title: string; make: string; model: string; year?: number; location?: string; description?: string | null; category?: string; attributes?: unknown }) {
  const attributes = listing.attributes && typeof listing.attributes === 'object'
    ? Object.values(listing.attributes as Record<string, unknown>).filter((value) => ['string', 'number'].includes(typeof value)).join(' ')
    : '';
  return [listing.title, listing.make, listing.model, listing.year, listing.category, listing.location, listing.description, attributes].filter(Boolean).join(' ');
}
