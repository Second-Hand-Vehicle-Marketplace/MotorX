import React, { useState } from 'react';
import { useI18n } from '@/shared/i18n/useI18n';
import { MAX_COMPARE, useCompare } from './CompareProvider';

// Adds a vehicle to, or removes it from, the compare list. When the list is full it says so
// instead of silently doing nothing.
export const CompareToggle: React.FC<{ listingId: string; title: string; className?: string }> = ({ listingId, title, className }) => {
  const { has, toggle } = useCompare();
  const { t } = useI18n();
  const [full, setFull] = useState(false);
  const selected = has(listingId);

  const onClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const changed = toggle(listingId);
    setFull(!changed);
    if (!changed) window.setTimeout(() => setFull(false), 3_000);
  };

  return (
    <span className={`compare-toggle-wrap ${className ?? ''}`}>
      <button type="button" className={`compare-toggle ${selected ? 'is-selected' : ''}`} aria-pressed={selected}
        aria-label={selected ? t('compare.removeLabel', { title }) : t('compare.addLabel', { title })} onClick={onClick}>
        <svg aria-hidden="true" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {selected ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />}
        </svg>
        <span>{selected ? t('compare.added') : t('compare.add')}</span>
      </button>
      {full && <span role="status" className="compare-full-message">{t('compare.full', { max: MAX_COMPARE })}</span>}
    </span>
  );
};
