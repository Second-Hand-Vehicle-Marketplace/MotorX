import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { buyerApi } from '@/features/buyers/services/buyerApi';
import { MAX_COMPARE, useCompare } from '@/features/compare/CompareProvider';
import { ListingPhoto } from '@/features/listings/components/ListingPhoto';
import type { Listing } from '@/features/listings/types/listing.types';
import { getBodyType, getCondition, getEngineCapacityCc, getFuelType, getMileageKm, getTransmission } from '@/features/listings/utils/vehicleAttributes';
import { useI18n } from '@/shared/i18n/useI18n';
import type { MessageKey } from '@/shared/i18n/messages/en';
import { formatPrice } from '@/shared/utils/formatters';

const objectId = /^[a-f\d]{24}$/i;
const number = (value: number) => new Intl.NumberFormat('en-LK').format(value);

interface CompareRow {
  label: MessageKey;
  value: (listing: Listing) => string | undefined;
  // For rows where a lower or higher number is clearly better, the best vehicle is highlighted.
  score?: (listing: Listing) => number | undefined;
  better?: 'lower' | 'higher';
}

// Indexes of the vehicles holding the best value in a row (ties all count); none when all are equal.
export function bestIndexes(values: Array<number | undefined>, better: 'lower' | 'higher'): number[] {
  const known = values.filter((value): value is number => value !== undefined);
  if (known.length < 2) return [];
  const best = better === 'lower' ? Math.min(...known) : Math.max(...known);
  if (known.every((value) => value === best)) return [];
  return values.flatMap((value, index) => (value === best ? [index] : []));
}

export const ComparePage: React.FC = () => {
  const { t, tEnum } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const { ids: pickedIds, remove } = useCompare();
  // The link decides what is compared, so a comparison can be shared; the picked list is the fallback.
  const fromUrl = (searchParams.get('ids') ?? '').split(',').map((id) => id.trim()).filter((id) => objectId.test(id));
  const ids = [...new Set(fromUrl.length ? fromUrl : pickedIds)].slice(0, MAX_COMPARE);

  // Removes the vehicle from the picked list and, when the page came from a link, from the link too.
  const removeVehicle = (id: string) => {
    remove(id);
    if (!fromUrl.length) return;
    const rest = ids.filter((item) => item !== id);
    setSearchParams(rest.length ? { ids: rest.join(',') } : {}, { replace: true });
  };

  const results = useQueries({ queries: ids.map((id) => ({ queryKey: ['buyer-listing', id], queryFn: () => buyerApi.getVehicle(id), retry: false })) });

  useEffect(() => { document.title = `${t('compare.title')} — MotorX`; return () => { document.title = 'MotorX — Second-Hand Vehicle Marketplace'; }; }, [t]);

  const rows: CompareRow[] = [
    { label: 'spec.price', value: (l) => formatPrice(l.price, l.currency), score: (l) => l.price, better: 'lower' },
    { label: 'spec.year', value: (l) => String(l.year), score: (l) => l.year, better: 'higher' },
    { label: 'spec.mileage', value: (l) => { const km = getMileageKm(l); return km === undefined ? undefined : `${number(km)} km`; }, score: getMileageKm, better: 'lower' },
    { label: 'spec.category', value: (l) => tEnum(l.category) },
    { label: 'spec.bodyType', value: (l) => getBodyType(l) && tEnum(getBodyType(l)) },
    { label: 'spec.condition', value: (l) => getCondition(l) && tEnum(getCondition(l)) },
    { label: 'spec.fuel', value: (l) => getFuelType(l) && tEnum(getFuelType(l)) },
    { label: 'spec.transmission', value: (l) => getTransmission(l) && tEnum(getTransmission(l)) },
    { label: 'spec.engine', value: (l) => { const cc = getEngineCapacityCc(l); return cc === undefined ? undefined : `${number(cc)} cc`; } },
    { label: 'spec.location', value: (l) => l.location },
    { label: 'spec.dealer', value: (l) => l.dealer?.businessName },
  ];

  const header = (
    <div className="page-header">
      <div>
        <h1 className="page-title">{t('compare.title')}</h1>
        <p className="page-subtitle">{t('compare.subtitle', { max: MAX_COMPARE })}</p>
      </div>
    </div>
  );

  if (!ids.length) {
    return <div className="compare-page">{header}<div className="glass-card empty-state"><p>{t('compare.empty')}</p><Link to="/marketplace" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>{t('compare.browse')}</Link></div></div>;
  }

  const loaded = results.map((result) => result.data);
  const vehicles = loaded.filter((listing): listing is Listing => Boolean(listing));

  return (
    <div className="compare-page">
      {header}
      {ids.length < 2 && <p className="compare-hint">{t('compare.needMore')} <Link to="/marketplace">{t('compare.browse')}</Link></p>}
      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col" className="compare-label-cell"><span className="visually-hidden">{t('compare.feature')}</span></th>
              {ids.map((id, index) => {
                const listing = loaded[index];
                const result = results[index]!;
                return (
                  <th key={id} scope="col" className="compare-vehicle-cell">
                    {result.isLoading && <div className="loading-spinner" role="status" aria-label={t('details.loading')} />}
                    {result.isError && <p className="compare-unavailable">{t('compare.unavailable')}</p>}
                    {listing && (
                      <Link to={`/marketplace/${listing.id}`} className="compare-vehicle-link">
                        {listing.images[0] && <ListingPhoto image={listing.images[0]} alt="" sizes="(max-width: 768px) 45vw, 300px" />}
                        <span>{listing.title}</span>
                      </Link>
                    )}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeVehicle(id)} aria-label={listing ? t('compare.removeLabel', { title: listing.title }) : t('compare.remove')}>
                      {t('compare.remove')}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {vehicles.length > 0 && rows.map((row) => {
              const best = row.score && row.better ? bestIndexes(loaded.map((listing) => (listing ? row.score!(listing) : undefined)), row.better) : [];
              return (
                <tr key={row.label}>
                  <th scope="row" className="compare-label-cell">{t(row.label)}</th>
                  {ids.map((id, index) => {
                    const listing = loaded[index];
                    const isBest = best.includes(index);
                    return (
                      <td key={id} className={isBest ? 'compare-best' : undefined}>
                        {listing ? row.value(listing) ?? '—' : ''}
                        {isBest && <span className="badge badge-success compare-best-badge">{t('compare.best')}</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
