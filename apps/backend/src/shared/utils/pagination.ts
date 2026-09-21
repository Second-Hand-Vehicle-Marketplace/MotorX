import type { PaginationMeta } from '@motorx/shared-contracts';

// Builds consistent pagination metadata for collection responses.
export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}
