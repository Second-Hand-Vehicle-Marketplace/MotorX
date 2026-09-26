import React from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '../types/listing.types';
import { getFuelType, getMileageKm, getTransmission } from '../utils/vehicleAttributes';
import { formatPrice, formatMileage } from '../../../shared/utils/formatters';
import { useI18n } from '../../../shared/i18n/useI18n';
import { CompareToggle } from '../../compare/CompareToggle';
import { ListingPhoto } from './ListingPhoto';
import { ListingStatusBadge } from './ListingStatusBadge';

interface ListingCardProps {
  listing: Listing;
  showStatus?: boolean;
  // Buyer pages offer "Compare"; dealer previews do not.
  comparable?: boolean;
}

// Cards are about 400 px wide in the desktop grid and full width on phones.
const CARD_IMAGE_SIZES = '(max-width: 768px) 100vw, 400px';

export const ListingCard: React.FC<ListingCardProps> = ({ listing, showStatus = false, comparable = true }) => {
  const { t, tEnum } = useI18n();
  const primaryImage = listing.images.find((img) => img.isPrimary) ?? listing.images[0];

  return (
    <article className="listing-card">
      <Link to={`/marketplace/${listing.id}`} className="listing-card-link">
        <div className="card-image">
          {primaryImage && <ListingPhoto image={primaryImage} alt={listing.title} sizes={CARD_IMAGE_SIZES} />}
          {showStatus && (
            <div className="card-badge">
              <ListingStatusBadge status={listing.status} />
            </div>
          )}
        </div>

        <div className="card-body">
          <div className="card-subtitle">
            {listing.year} · {listing.make} · {tEnum(getFuelType(listing))}
          </div>
          <h3 className="card-title">{listing.title}</h3>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem', gap: '0.5rem' }}>
            <div className="card-price">{formatPrice(listing.price, listing.currency)}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{listing.location ?? t('card.verifiedDealer')}</span>
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
              <span>{tEnum(getTransmission(listing))}</span>
            </div>
          </div>
        </div>
      </Link>
      {comparable && <CompareToggle listingId={listing.id} title={listing.title} className="card-compare" />}
    </article>
  );
};
