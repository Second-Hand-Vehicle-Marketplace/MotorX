import React from 'react';
import type { PaginationMeta } from '@motorx/shared-contracts';

// Previous/next paging for admin tables, with the position and total shown in words.
export const PagerControls: React.FC<{ meta: PaginationMeta | null; onPage: (page: number) => void; label: string }> = ({ meta, onPage, label }) => {
  if (!meta || meta.total === 0) return null;
  const first = (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);
  return (
    <nav aria-label={`${label} pages`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'flex-end', padding: '0.75rem 1rem' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{first}–{last} of {meta.total} {label}</span>
      <button type="button" className="btn btn-secondary btn-sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</button>
      <button type="button" className="btn btn-secondary btn-sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</button>
    </nav>
  );
};
