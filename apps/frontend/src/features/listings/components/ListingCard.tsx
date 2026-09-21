import React from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '../types/listing.types';
import { formatEnumLabel, getFuelType, getMileageKm, getTransmission } from '../utils/vehicleAttributes';
import { formatPrice, formatMileage } from '../../../shared/utils/formatters';
import { ListingStatusBadge } from './ListingStatusBadge';

interface ListingCardProps {
  listing: Listing;
  showStatus?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, showStatus = false }) => {
  const primaryImage = listing.images.find(img => img.isPrimary)?.url || listing.images[0]?.url || '';

  return (
    <Link to={`/marketplace/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="listing-card">
        <div className="card-image">
          <img src={primaryImage} alt={listing.title} loading="lazy" />
          {showStatus && (
            <div className="card-badge">
              <ListingStatusBadge status={listing.status} />
            </div>
          )}
        </div>

        <div className="card-body">
          <div className="card-subtitle">
            {listing.year} · {listing.make} · {formatEnumLabel(getFuelType(listing))}
          </div>
          <h3 className="card-title">{listing.title}</h3>
          
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <div className="card-price">{formatPrice(listing.price, listing.currency)}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{listing.location ?? 'Verified dealer'}</span>
          </div>

          <div className="card-meta">
            <div className="meta-item">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{formatMileage(getMileageKm(listing) ?? 0)}</span>
            </div>

            <div className="meta-item">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>{formatEnumLabel(getTransmission(listing))}</span>
            </div>

            <div className="meta-item" style={{ marginLeft: 'auto' }}>
              {listing.location && <span className="badge badge-neutral">{listing.location}</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
