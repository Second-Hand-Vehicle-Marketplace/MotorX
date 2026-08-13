import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useListing } from '@/features/listings/hooks/useListing';
import { ListingGallery } from '@/features/listings/components/ListingGallery';
import { formatPrice, formatMileage, formatDate } from '@/shared/mockData';

export const VehicleDetails: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const { listing, isLoading } = useListing(listingId);

  if (isLoading) {
    return <div className="loading-spinner" style={{ margin: '6rem auto', display: 'block' }} />;
  }

  if (!listing) {
    return (
      <div style={{ maxWidth: 800, margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Vehicle Not Found</h2>
        <p style={{ color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
          The requested listing could not be found or has been removed.
        </p>
        <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginBottom: '1.5rem' }}>
        <Link to="/marketplace" style={{ color: 'var(--color-text-secondary)' }}>Marketplace</Link>
        <span>/</span>
        <span>{listing.make}</span>
        <span>/</span>
        <span style={{ color: 'var(--color-text-primary)' }}>{listing.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left Column — Gallery + Specs + Description */}
        <div>
          <ListingGallery images={listing.images} title={listing.title} />

          {/* Overview Specs */}
          <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>Vehicle Specifications</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Year</span>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>{listing.year}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Mileage</span>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>{formatMileage(listing.mileage)}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Fuel Type</span>
                <p style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize' }}>{listing.fuelType}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Transmission</span>
                <p style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize' }}>{listing.transmission}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Body Type</span>
                <p style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize' }}>{listing.bodyType}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Color</span>
                <p style={{ fontSize: '1rem', fontWeight: 600 }}>{listing.color}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Condition</span>
                <p style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'capitalize' }}>{listing.condition}</p>
              </div>
              {listing.vin && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>VIN</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'monospace' }}>{listing.vin}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Description</h3>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {listing.description}
            </p>
          </div>
        </div>

        {/* Right Column — Dealer Info & Contact CTA */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', position: 'sticky', top: '5.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{listing.title}</h1>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent-light)', marginBottom: '1.5rem' }}>
              {formatPrice(listing.price, listing.currency)}
            </div>

            <div style={{ borderTop: '1px solid var(--color-glass-border)', borderBottom: '1px solid var(--color-glass-border)', padding: '1rem 0', margin: '1rem 0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sold By Dealer
              </span>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '0.25rem' }}>{listing.dealerName}</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Verified Dealership · Member since 2025
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Contact Dealer
              </button>
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                Schedule Test Drive
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Listed {formatDate(listing.createdAt)}</span>
              <span>{listing.views} views</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};