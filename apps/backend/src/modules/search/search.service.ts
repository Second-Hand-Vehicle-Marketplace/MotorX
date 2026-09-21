import { composeListingSearchText } from '@motorx/shared-contracts';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { serializeListing } from '../marketplace/listing.service.js';
import type { ListingRecord } from '../marketplace/listing.repository.js';
import { generateSearchEmbedding } from './search.embedding.js';
import { analyzeSearchQuery } from './search.queryAnalyzer.js';
import { listSearchCandidates, listStructuredListings, listVectorCandidates, type SearchFilters } from './search.repository.js';
import type { SearchQuery } from './search.validation.js';

function lexicalScore(query: string, listing: Record<string, unknown>) {
  const tokens = query.toLocaleLowerCase('en').match(/[a-z0-9]+/g) ?? [];
  if (!tokens.length) return 0;
  const content = composeListingSearchText(listing as never).toLocaleLowerCase('en');
  const matched = tokens.filter((token) => content.includes(token)).length;
  const phraseBonus = content.includes(query.toLocaleLowerCase('en')) ? 0.2 : 0;
  return Math.min(1, matched / tokens.length + phraseBonus);
}

function asRecordId(value: unknown) { return String((value as { _id: unknown })._id); }

function matchesFullFilter(document: Record<string, unknown>, filters: SearchFilters) {
  const text = (value: unknown) => String(value ?? '').toLocaleLowerCase('en');
  const attributes = (document.attributes ?? {}) as Record<string, unknown>;
  const includes = (actual: unknown, expected?: string) => !expected || text(actual).includes(text(expected));
  const equals = (actual: unknown, expected?: string) => !expected || text(actual) === text(expected);
  const within = (actual: unknown, minimum?: number, maximum?: number) => {
    if (minimum === undefined && maximum === undefined) return true;
    const value = Number(actual);
    return Number.isFinite(value) && (minimum === undefined || value >= minimum) && (maximum === undefined || value <= maximum);
  };
  return equals(document.make, filters.make) && includes(document.model, filters.model) && includes(document.location, filters.location)
    && equals(document.category, filters.category) && equals(attributes.fuelType, filters.fuelType)
    && equals(attributes.transmission, filters.transmission) && equals(attributes.bodyType, filters.bodyType)
    && equals(attributes.condition, filters.condition) && within(document.year, filters.yearMin, filters.yearMax)
    && within(document.price, filters.priceMin, filters.priceMax) && within(attributes.mileageKm, filters.mileageMin, filters.mileageMax);
}

// Executes structured-only search directly, or bounded hybrid ranking with safe degradation.
export async function searchListings(query: SearchQuery) {
  const startedAt = performance.now();
  const analyzed = analyzeSearchQuery(query.q);
  const { q, sortBy, ...explicit } = query;
  const filters: SearchFilters = { ...analyzed.filters, ...explicit, sortBy: sortBy === 'relevance' ? 'newest' : sortBy };
  const hasStructuredFilters = Object.values(analyzed.filters).some((value) => value !== undefined);

  if (sortBy !== 'relevance' || !analyzed.intent) {
    const structured = await listStructuredListings({ ...filters, ...(analyzed.intent && !hasStructuredFilters ? { search: analyzed.intent } : {}) });
    return {
      listings: structured.documents.map((document) => serializeListing(document as unknown as ListingRecord)),
      pagination: buildPaginationMeta(query.page, query.limit, structured.total),
      search: { query: q, interpreted: analyzed.filters, correctedTerms: analyzed.correctedTerms, mode: 'structured' as const, durationMs: Math.round(performance.now() - startedAt) },
    };
  }

  const candidatesPromise = listSearchCandidates(filters);
  const vectorPromise = (async () => {
    try {
      const embedding = await generateSearchEmbedding(q);
      return { documents: await listVectorCandidates(embedding, filters) as Array<Record<string, unknown>>, mode: 'hybrid' as const };
    } catch {
      return { documents: [] as Array<Record<string, unknown>>, mode: 'lexical-fallback' as const };
    }
  })();
  const [candidates, vectorResult] = await Promise.all([candidatesPromise, vectorPromise]);
  const vectorDocuments = vectorResult.documents;
  const mode = vectorResult.mode;
  const merged = new Map<string, Record<string, unknown>>();
  for (const document of candidates.documents as unknown as Array<Record<string, unknown>>) merged.set(asRecordId(document), document);
  for (const document of vectorDocuments) {
    const id = asRecordId(document);
    if (matchesFullFilter(document, filters)) merged.set(id, { ...merged.get(id), ...document });
  }
  const ranked = [...merged.values()].map((document) => {
    const semantic = typeof document.vectorScore === 'number' ? document.vectorScore : 0;
    return { document, score: semantic * 0.65 + lexicalScore(q, document) * 0.35 };
  }).sort((left, right) => right.score - left.score || asRecordId(right.document).localeCompare(asRecordId(left.document)));
  const offset = (query.page - 1) * query.limit;
  const page = ranked.slice(offset, offset + query.limit);
  const total = Math.min(candidates.total, ranked.length);
  return {
    listings: page.map(({ document }) => serializeListing(document as unknown as ListingRecord)),
    pagination: buildPaginationMeta(query.page, query.limit, total),
    search: { query: q, interpreted: analyzed.filters, correctedTerms: analyzed.correctedTerms, mode, durationMs: Math.round(performance.now() - startedAt) },
  };
}
