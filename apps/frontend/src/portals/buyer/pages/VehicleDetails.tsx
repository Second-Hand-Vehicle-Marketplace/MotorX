import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useListing } from '@/features/listings/hooks/useListing';
import { ListingGallery } from '@/features/listings/components/ListingGallery';
import { formatPrice, formatMileage, formatDate } from '@/shared/utils/formatters';
import { listingApi } from '@/features/listings/services/listingApi';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const VehicleDetails: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const { listing, isLoading } = useListing(listingId);
  const { user } = useAuth();
  const [actionMessage, setActionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitInquiry = async (type: 'contact' | 'test_drive') => {
    if (!listingId || !listing) return;
    const buyerName = user?.displayName || window.prompt('Your name')?.trim();
    const buyerEmail = user?.email || window.prompt('Your email address')?.trim();
    if (!buyerName || !buyerEmail) return;
    const buyerPhone = window.prompt('Phone number (optional)')?.trim() || undefined;
    const preferredDate = type === 'test_drive' ? window.prompt('Preferred test-drive date and time')?.trim() || undefined : undefined;
    const message = window.prompt(type === 'test_drive' ? 'Message for the dealer (optional)' : 'What would you like to ask?')?.trim() || undefined;

    setIsSubmitting(true);
    try {
      await listingApi.createInquiry(listingId, { type, buyerName, buyerEmail, buyerPhone, preferredDate, message });
      setActionMessage(type === 'test_drive' ? 'Your test-drive request was sent to the dealer.' : 'Your contact request was sent to the dealer.');
    } catch {
      setActionMessage('The request could not be sent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {listing.plateNumber && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Plate Number</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'monospace' }}>{listing.plateNumber}</p>
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

            {listing.status === 'sold' && <div className="badge badge-error" style={{ display: 'inline-block', marginBottom: '1rem' }}>Sold</div>}

            <div style={{ borderTop: '1px solid var(--color-glass-border)', borderBottom: '1px solid var(--color-glass-border)', padding: '1rem 0', margin: '1rem 0' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sold By Dealer
              </span>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '0.25rem' }}>{listing.dealerName}</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Verified Dealership · Member since 2025
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', padding: '0.9rem 0 0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              {listing.dealerContact?.phone && <a href={`tel:${listing.dealerContact.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>☎ {listing.dealerContact.phone}</a>}
              {listing.dealerContact?.email && <a href={`mailto:${listing.dealerContact.email}`} style={{ color: 'inherit', textDecoration: 'none', overflowWrap: 'anywhere' }}>✉ {listing.dealerContact.email}</a>}
              {listing.dealerContact?.address && <span>⌖ {listing.dealerContact.address}</span>}
              {!listing.dealerContact?.phone && !listing.dealerContact?.email && !listing.dealerContact?.address && <span>Contact details available through the inquiry form.</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => void submitInquiry('contact')} disabled={isSubmitting || listing.status === 'sold'}>
                {listing.status === 'sold' ? 'Vehicle Sold' : 'Contact Dealer'}
              </button>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => void submitInquiry('test_drive')} disabled={isSubmitting || listing.status === 'sold'}>
                Schedule Test Drive
              </button>
            </div>

            {actionMessage && <p style={{ color: 'var(--color-success)', fontSize: '0.8125rem', marginTop: '1rem' }}>{actionMessage}</p>}

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