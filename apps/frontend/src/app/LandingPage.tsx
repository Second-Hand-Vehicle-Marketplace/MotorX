import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListingCard } from '../features/listings/components/ListingCard';
import { useBuyerListings } from '../features/buyers/hooks/useBuyerListings';

export const LandingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data, isLoading, isError } = useBuyerListings({}, 6);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  const featuredListings = data.data;

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-accent-subtle)',
          border: '1px solid var(--color-glass-border)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-accent-light)',
          marginBottom: '1.5rem',
        }}>
          ✨ Next-Gen Second-Hand Vehicle Marketplace
        </div>

        <h1 className="hero-title">
          Drive the Future with <span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MotorX</span>
        </h1>

        <p className="hero-subtitle">
          Discover certified pre-owned luxury sedans, electric vehicles, SUVs, and sports cars directly from verified dealership inventories.
        </p>

        {/* Natural Language & Keyword Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hero-search-bar" style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="Search make, model, body type (e.g. 'Tesla Model 3', 'BMW Sedan', 'Electric')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn">
            Search Inventory
          </button>
        </form>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
          <span>✓ 100% Verified Dealers</span>
          <span>✓ Real-time Inventory</span>
          <span>✓ Automated ETL Batch Sync</span>
        </div>
      </section>

      {/* Featured Vehicles Grid */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Featured Vehicles</h2>
            <p style={{ color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>Hand-picked top quality pre-owned vehicles available now</p>
          </div>
          <Link to="/marketplace" className="btn btn-secondary">
            View All ({data.total}) →
          </Link>
        </div>

        {isLoading && <div className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />}
        {isError && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)' }}>Could not load featured vehicles.</div>}
        <div className="listings-grid">
          {featuredListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Why Choose MotorX */}
      <section style={{ background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-glass-border)', borderBottom: '1px solid var(--color-glass-border)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Built for Buyers & Dealerships</h2>
            <p style={{ color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>Automated CSV data processing, real-time status notifications, and structured vehicle search</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--color-accent-light)' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Smart Search & Filters</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Filter by make, model, year, price range, body style, and fuel type. Find exact matches instantly.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--color-amber)' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Bulk CSV Inventory Sync</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Dealerships can upload hundreds of vehicles in seconds via automated ETL pipeline validation.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--color-success)' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Verified Dealerships</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Every dealer goes through business license verification and admin approval before listing vehicles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal CTA Banner */}
      <section style={{ maxWidth: 1280, margin: '4rem auto', padding: '0 1.5rem' }}>
        <div className="glass-card" style={{ padding: '3.5rem', borderRadius: 'var(--radius-2xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(18, 18, 26, 0.9) 100%)' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Are You a Vehicle Dealer?</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', maxWidth: 500 }}>
              Join MotorX today to manage your inventory, process bulk CSV uploads, and reach thousands of interested buyers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/dealer/apply" className="btn btn-primary btn-lg">
              Apply as Dealer
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
