import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { carBodyTypes, transmissionTypes, vehicleConditions } from '@motorx/shared-contracts';
import { useBuyerListings } from '@/features/buyers/hooks/useBuyerListings';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { RecommendedVehicles } from '@/features/recommendations/VehicleSuggestions';
import { buyerFuelTypes, buyerVehicleCategories, buyerVehicleMakes } from '@/features/buyers/buyer.constants';
import type { FuelType, ListingFilters, VehicleCategory } from '@/features/listings/types/listing.types';
import { useI18n } from '@/shared/i18n/useI18n';

// Filters that narrow the results (search text and sort order are shown elsewhere).
const countActiveFilters = (filters: ListingFilters) =>
  Object.entries(filters).filter(([key, value]) => !['q', 'search', 'sortBy'].includes(key) && value !== undefined && value !== '').length;

const toNumber = (value: string) => (value ? Number(value) : undefined);

export const Marketplace: React.FC = () => {
  const { t, tEnum } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = (searchParams.get('q') ?? searchParams.get('search') ?? '').trim();
  const { data, filters, updateFilters, resetFilters, page, setPage, isLoading, isFetching, isError, refetch } = useBuyerListings(initialQuery ? { q: initialQuery, sortBy: 'relevance' } : {}, 9);
  const [searchInput, setSearchInput] = useState(initialQuery);
  // Phones and tablets: the filters open as a sheet over the results instead of sitting above them.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const activeFilters = countActiveFilters(filters);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const q = searchInput.trim() || undefined;
      updateFilters({ q, search: undefined, sortBy: q ? (filters.sortBy || 'relevance') : filters.sortBy === 'relevance' ? 'newest' : filters.sortBy });
      setSearchParams(q ? { q } : {}, { replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, setSearchParams, updateFilters]);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.querySelector<HTMLElement>('button, input, select')?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeFilters(); };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, [filtersOpen]);

  const closeFilters = () => { setFiltersOpen(false); filtersButtonRef.current?.focus(); };
  const clearAll = () => { setSearchInput(''); setSearchParams({}, { replace: true }); resetFilters(); };
  const browsing = !filters.q && activeFilters === 0 && page === 1;

  return (
    <div className="marketplace-page">
      <div className="glass-card marketplace-dealer-prompt">
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t('market.dealerPromptTitle')}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t('market.dealerPromptBody')}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/dealer/register" className="btn btn-primary btn-sm">{t('market.registerDealer')}</Link>
          <Link to="/login" className="btn btn-secondary btn-sm">{t('market.dealerSignIn')}</Link>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('market.title')}</h1>
          <p className="page-subtitle">{t('market.subtitle')}</p>
        </div>
      </div>

      <div className="marketplace-search-bar">
        <label className="visually-hidden" htmlFor="marketplace-search">{t('filters.smartSearch')}</label>
        <input
          id="marketplace-search"
          type="search"
          enterKeyHint="search"
          className="form-input"
          maxLength={200}
          placeholder={t('filters.searchPlaceholder')}
          aria-describedby="marketplace-search-help"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button ref={filtersButtonRef} type="button" className="btn btn-secondary marketplace-filters-button" aria-expanded={filtersOpen} aria-controls="marketplace-filters" onClick={() => setFiltersOpen(true)}>
          <svg aria-hidden="true" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth={2} d="M3 5h18M6 12h12M10 19h4" /></svg>
          {activeFilters ? t('filters.buttonCount', { count: activeFilters }) : t('filters.button')}
        </button>
      </div>
      <small id="marketplace-search-help" className="search-help marketplace-search-help">{t('filters.searchHelp')}</small>

      {browsing && <RecommendedVehicles />}

      <div className="marketplace-search-layout">
        {filtersOpen && <button type="button" className="filter-backdrop" aria-label={t('filters.close')} onClick={closeFilters} />}
        <aside id="marketplace-filters" ref={sheetRef} className={`glass-card filter-sidebar ${filtersOpen ? 'is-open' : ''}`} aria-label={t('filters.title')}>
          <div className="filter-sheet-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{t('filters.title')}</h3>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button type="button" onClick={clearAll} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-accent-light)' }}>{t('filters.reset')}</button>
              <button type="button" onClick={closeFilters} className="btn btn-ghost btn-sm filter-sheet-only" aria-label={t('filters.close')}>✕</button>
            </div>
          </div>

          <div className="filter-sheet-body">
            <div className="filter-section">
              <label className="filter-title" htmlFor="location-filter">{t('filters.location')}</label>
              <input id="location-filter" type="search" className="form-input" maxLength={120} autoComplete="address-level2" placeholder={t('filters.locationPlaceholder')} value={filters.location || ''} onChange={(e) => updateFilters({ location: e.target.value || undefined })} />
            </div>

            <div className="filter-section">
              <label className="filter-title" htmlFor="category-filter">{t('filters.vehicleType')}</label>
              <select id="category-filter" className="form-select" value={filters.category || ''} onChange={(e) => updateFilters({ category: (e.target.value as VehicleCategory) || undefined, ...(e.target.value !== 'car' ? { bodyType: undefined } : {}) })}>
                <option value="">{t('filters.allTypes')}</option>
                {buyerVehicleCategories.map((category) => <option key={category} value={category}>{tEnum(category)}</option>)}
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-title" htmlFor="make-filter">{t('filters.make')}</label>
              <select id="make-filter" className="form-select" value={filters.make || ''} onChange={(e) => updateFilters({ make: e.target.value || undefined })}>
                <option value="">{t('filters.allMakes')}</option>
                {buyerVehicleMakes.map((make) => <option key={make} value={make}>{make}</option>)}
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-title" htmlFor="fuel-filter">{t('filters.fuel')}</label>
              <select id="fuel-filter" className="form-select" value={filters.fuelType || ''} onChange={(e) => updateFilters({ fuelType: (e.target.value as FuelType) || undefined })}>
                <option value="">{t('filters.allFuel')}</option>
                {buyerFuelTypes.map((fuel) => <option key={fuel} value={fuel}>{tEnum(fuel)}</option>)}
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-title" htmlFor="transmission-filter">{t('filters.transmission')}</label>
              <select id="transmission-filter" className="form-select" value={filters.transmission || ''} onChange={(e) => updateFilters({ transmission: e.target.value || undefined })}>
                <option value="">{t('filters.anyTransmission')}</option>
                {transmissionTypes.map((value) => <option key={value} value={value}>{tEnum(value)}</option>)}
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-title" htmlFor="condition-filter">{t('filters.condition')}</label>
              <select id="condition-filter" className="form-select" value={filters.condition || ''} onChange={(e) => updateFilters({ condition: e.target.value || undefined })}>
                <option value="">{t('filters.anyCondition')}</option>
                {vehicleConditions.map((value) => <option key={value} value={value}>{tEnum(value)}</option>)}
              </select>
            </div>

            {/* Body type only means something once narrowed to cars */}
            {filters.category === 'car' && (
              <div className="filter-section">
                <label className="filter-title" htmlFor="body-filter">{t('filters.bodyType')}</label>
                <select id="body-filter" className="form-select" value={filters.bodyType || ''} onChange={(e) => updateFilters({ bodyType: e.target.value || undefined })}>
                  <option value="">{t('filters.anyBodyType')}</option>
                  {carBodyTypes.map((value) => <option key={value} value={value}>{tEnum(value)}</option>)}
                </select>
              </div>
            )}

            <fieldset className="filter-section">
              <legend className="filter-title">{t('filters.year')}</legend>
              <div className="filter-range">
                <input type="number" inputMode="numeric" min="1900" aria-label={t('filters.minYear')} className="form-input" placeholder={t('filters.from')} value={filters.yearMin || ''} onChange={(e) => updateFilters({ yearMin: toNumber(e.target.value) })} />
                <input type="number" inputMode="numeric" min="1900" aria-label={t('filters.maxYear')} className="form-input" placeholder={t('filters.to')} value={filters.yearMax || ''} onChange={(e) => updateFilters({ yearMax: toNumber(e.target.value) })} />
              </div>
            </fieldset>

            <fieldset className="filter-section">
              <legend className="filter-title">{t('filters.price')}</legend>
              <div className="filter-range">
                <input type="number" inputMode="numeric" min="0" step="1000" aria-label={t('filters.minPrice')} className="form-input" placeholder={t('filters.min')} value={filters.priceMin || ''} onChange={(e) => updateFilters({ priceMin: toNumber(e.target.value) })} />
                <input type="number" inputMode="numeric" min="0" step="1000" aria-label={t('filters.maxPrice')} className="form-input" placeholder={t('filters.max')} value={filters.priceMax || ''} onChange={(e) => updateFilters({ priceMax: toNumber(e.target.value) })} />
              </div>
            </fieldset>

            <fieldset className="filter-section">
              <legend className="filter-title">{t('filters.mileage')}</legend>
              <div className="filter-range">
                <input type="number" min="0" inputMode="numeric" aria-label={t('filters.minMileage')} className="form-input" placeholder={t('filters.min')} value={filters.mileageMin || ''} onChange={(e) => updateFilters({ mileageMin: toNumber(e.target.value) })} />
                <input type="number" min="0" inputMode="numeric" aria-label={t('filters.maxMileage')} className="form-input" placeholder={t('filters.max')} value={filters.mileageMax || ''} onChange={(e) => updateFilters({ mileageMax: toNumber(e.target.value) })} />
              </div>
            </fieldset>
          </div>

          <div className="filter-sheet-footer filter-sheet-only">
            <button type="button" className="btn btn-primary" onClick={closeFilters}>{t('filters.showResults', { count: data.total })}</button>
          </div>
        </aside>

        <div style={{ flex: 1 }}>
          <div className="marketplace-results-bar">
            <span aria-live="polite" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {t('market.showing', { shown: data.data.length, total: data.total })}
              {isFetching && !isLoading ? ` · ${t('market.updating')}` : ''}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>{t('market.sortBy')}</span>
              <select
                aria-label={t('market.sortLabel')}
                className="form-select marketplace-sort"
                value={filters.sortBy || (filters.q ? 'relevance' : 'newest')}
                onChange={(e) => updateFilters({ sortBy: e.target.value as NonNullable<typeof filters.sortBy> })}
              >
                {filters.q && <option value="relevance">{t('sort.relevance')}</option>}
                <option value="newest">{t('sort.newest')}</option>
                <option value="price-asc">{t('sort.priceAsc')}</option>
                <option value="price-desc">{t('sort.priceDesc')}</option>
                <option value="year-desc">{t('sort.yearDesc')}</option>
                <option value="mileage-asc">{t('sort.mileageAsc')}</option>
              </select>
            </div>
          </div>

          {isLoading && <div role="status" aria-label={t('market.loading')} className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />}
          {isError && <div role="alert" className="glass-card search-error">{t('market.loadError')} <button type="button" className="btn btn-secondary btn-sm" onClick={() => refetch()}>{t('common.tryAgain')}</button></div>}
          {!isLoading && !isError && (data.data.length > 0 ? (
            <div className="listings-grid">
              {data.data.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="glass-card empty-state">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3>{t('market.noneTitle')}</h3>
              <p>{t('market.noneBody')}</p>
              <button onClick={clearAll} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>{t('market.clearFilters')}</button>
            </div>
          ))}

          {data.totalPages > 1 && (
            <nav className="pagination" aria-label={t('pager.label')}>
              <button className="page-btn" disabled={page === 1} onClick={() => setPage((current) => current - 1)} aria-label={t('pager.previousLabel')}>{t('pager.previous')}</button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).filter((value) => value === 1 || value === data.totalPages || Math.abs(value - page) <= 1).map((p) => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined} aria-label={t('pager.page', { page: p })}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === data.totalPages} onClick={() => setPage((current) => current + 1)} aria-label={t('pager.nextLabel')}>{t('pager.next')}</button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};
