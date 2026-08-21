import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBuyerListing } from '@/features/buyers/hooks/useBuyerListing';
import { ListingGallery } from '@/features/listings/components/ListingGallery';
import { formatEnumLabel, getBatteryCapacityKWh, getBatteryRangeKm, getBodyType, getCondition, getEdition, getEngineCapacityCc, getFuelType, getMileageKm, getTransmission } from '@/features/listings/utils/vehicleAttributes';
import { formatPrice, formatDate } from '@/shared/utils/formatters';

// Dealers can enter a website without a scheme (e.g. "www.abcmotors.lk"); without one, the
// browser would treat the href as a relative path instead of an external link.
function toAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

const dealerContactRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  fontSize: '0.8125rem', color: 'var(--color-text-secondary)',
};

const PhoneIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const MailIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const WebsiteIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
  </svg>
);

export const VehicleDetails: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const { listing, isLoading } = useBuyerListing(listingId);

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

  const engineCapacityCc = getEngineCapacityCc(listing);
  const batteryCapacityKWh = getBatteryCapacityKWh(listing);
  const batteryRangeKm = getBatteryRangeKm(listing);
  const mileageKm = getMileageKm(listing);

  const specs: Array<[string, string]> = [
    ['Model', listing.model],
    ...(getEdition(listing) ? [['Edition', getEdition(listing) as string] as [string, string]] : []),
    ...(getBodyType(listing) ? [['Body Type', formatEnumLabel(getBodyType(listing))] as [string, string]] : []),
    ['Year of Manufacture', String(listing.year)],
    ...(getCondition(listing) ? [['Condition', formatEnumLabel(getCondition(listing))] as [string, string]] : []),
    ...(getTransmission(listing) ? [['Transmission', formatEnumLabel(getTransmission(listing))] as [string, string]] : []),
    ...(getFuelType(listing) ? [['Fuel Type', formatEnumLabel(getFuelType(listing))] as [string, string]] : []),
    ...(engineCapacityCc !== undefined ? [['Engine Capacity', `${new Intl.NumberFormat('en-LK').format(engineCapacityCc)} cc`] as [string, string]] : []),
    ...(batteryCapacityKWh !== undefined ? [['Battery Capacity', `${batteryCapacityKWh} kWh`] as [string, string]] : []),
    ...(batteryRangeKm !== undefined ? [['Battery Range', `${new Intl.NumberFormat('en-LK').format(batteryRangeKm)} km`] as [string, string]] : []),
    ...(mileageKm !== undefined ? [['Mileage', `${new Intl.NumberFormat('en-LK').format(mileageKm)} km`] as [string, string]] : []),
    ['Location', listing.location ?? '—'],
  ];

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
              {specs.map(([label, value]) => (
                <div key={label}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{label}</span>
                  <p style={{ fontSize: '1rem', fontWeight: 600 }}>{value}</p>
                </div>
              ))}
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
                Sold by
              </span>
              {listing.dealer ? (
                <>
                  <h4 style={{ fontSize: '1.375rem', fontWeight: 800, marginTop: '0.25rem', lineHeight: 1.25 }}>{listing.dealer.businessName}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.75rem' }}>
                    <a href={`tel:${listing.dealer.phone}`} style={dealerContactRowStyle}>
                      <PhoneIcon /> {listing.dealer.phone}
                    </a>
                    <a href={`mailto:${listing.dealer.email}`} style={dealerContactRowStyle}>
                      <MailIcon /> {listing.dealer.email}
                    </a>
                    {listing.dealer.website && (
                      <a href={toAbsoluteUrl(listing.dealer.website)} target="_blank" rel="noopener noreferrer" style={dealerContactRowStyle}>
                        <WebsiteIcon /> {listing.dealer.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                  Dealer information unavailable
                </p>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{listing.publishedAt ? `Listed ${formatDate(listing.publishedAt)}` : 'Active listing'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
