import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { useI18n } from '@/shared/i18n/useI18n';
import { MAX_COMPARE, useCompare } from './CompareProvider';

// A bar along the bottom of the buyer pages while vehicles are picked for comparison.
// Hidden on the compare page itself, which already shows them.
export const CompareTray: React.FC = () => {
  const { ids, clear } = useCompare();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const visible = ids.length > 0 && pathname !== '/compare';
  useBodyClass('has-compare-tray', visible);
  if (!visible) return null;

  return (
    <aside className="compare-tray" aria-label={t('compare.trayLabel')}>
      <span className="compare-tray-count" aria-live="polite">{t('compare.trayCount', { count: ids.length, max: MAX_COMPARE })}</span>
      <div className="compare-tray-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>{t('compare.clear')}</button>
        <Link to={`/compare?ids=${ids.join(',')}`} className="btn btn-primary btn-sm">{t('compare.now')}</Link>
      </div>
    </aside>
  );
};
