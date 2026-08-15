import React from 'react';
import { Link } from 'react-router-dom';
import { useBuyerListings } from '@/features/buyers/hooks/useBuyerListings';
import { ListingCard } from '@/features/listings/components/ListingCard';
import { buyerFuelTypes, buyerVehicleMakes } from '@/features/buyers/buyer.constants';
import type { FuelType } from '@/features/listings/types/listing.types';

export const Marketplace: React.FC = () => {
  const { data, filters, updateFilters, resetFilters, page, setPage, isLoading, isError } = useBuyerListings({}, 9);

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Are you a dealer?</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Register to upload inventory. Buyers can browse the marketplace without signing in.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/dealer/register" className="btn btn-primary btn-sm">Register as a Dealer</Link>
          <Link to="/login" className="btn btn-secondary btn-sm">Dealer Sign In</Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Marketplace</h1>
          <p className="page-subtitle">Discover premium pre-owned vehicles from verified dealerships</p>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Filter Sidebar */}
        <aside className="glass-card filter-sidebar" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Filters</h3>
            <button type="button" onClick={resetFilters} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-accent-light)' }}>
              Reset All
            </button>
          </div>

          {/* Search input */}
          <div className="filter-section">
            <label className="filter-title">Search Keywords</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. BMW 3 Series..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
          </div>

          {/* Make Filter */}
          <div className="filter-section">
            <label className="filter-title">Make</label>
            <select
              className="form-select"
              value={filters.make || ''}
              onChange={(e) => updateFilters({ make: e.target.value || undefined })}
            >
              <option value="">All Makes</option>
              {buyerVehicleMakes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>

          {/* Fuel Type */}
          <div className="filter-section">
            <label className="filter-title">Fuel Type</label>
            <select
              className="form-select"
              value={filters.fuelType || ''}
              onChange={(e) => updateFilters({ fuelType: (e.target.value as FuelType) || undefined })}
            >
              <option value="">All Fuel Types</option>
              {buyerFuelTypes.map(ft => (
                <option key={ft} value={ft} style={{ textTransform: 'capitalize' }}>{ft}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <label className="filter-title">Max Price ($)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 50000"
              value={filters.priceMax || ''}
              onChange={(e) => updateFilters({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </aside>

        {/* Listings Section */}
        <div style={{ flex: 1 }}>
          {/* Top Bar: Count + Sort */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            padding: '0.75rem 1.25rem',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-glass-border)',
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Showing <strong style={{ color: 'var(--color-text-primary)' }}>{data.data.length}</strong> of {data.total} vehicles
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>Sort by:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.375rem 2rem 0.375rem 0.75rem', fontSize: '0.8125rem' }}
                value={filters.sortBy || 'newest'}
                onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="year-desc">Year: Newest</option>
                <option value="mileage-asc">Lowest Mileage</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {isLoading && <div className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />}
          {isError && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)' }}>Could not load marketplace listings.</div>}
          {!isLoading && !isError && (data.data.length > 0 ? (
            <div className="listings-grid">
              {data.data.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="glass-card empty-state">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3>No Vehicles Found</h3>
              <p>Try adjusting your search criteria or clearing filters to see more results.</p>
              <button onClick={resetFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
                Clear Filters
              </button>
            </div>
          ))}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Previous
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={page === data.totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
