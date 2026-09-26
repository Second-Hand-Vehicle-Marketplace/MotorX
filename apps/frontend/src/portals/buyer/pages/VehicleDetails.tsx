import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBuyerListing } from '@/features/buyers/hooks/useBuyerListing';
import { CompareToggle } from '@/features/compare/CompareToggle';
import { ListingGallery } from '@/features/listings/components/ListingGallery';
import { getBatteryCapacityKWh, getBatteryRangeKm, getBodyType, getCondition, getEdition, getEngineCapacityCc, getFuelType, getMileageKm, getTransmission } from '@/features/listings/utils/vehicleAttributes';
import { recordRecentlyViewed } from '@/features/recommendations/recentlyViewed';
import { SimilarVehicles } from '@/features/recommendations/VehicleSuggestions';
import { useBodyClass } from '@/shared/hooks/useBodyClass';
import { useI18n } from '@/shared/i18n/useI18n';
import type { MessageKey } from '@/shared/i18n/messages/en';
import { formatPrice, formatDate } from '@/shared/utils/formatters';
import { whatsAppLink } from '@/shared/utils/phone';

// Dealers can enter a website without a scheme (e.g. "www.abcmotors.lk"); without one, the
// browser would treat the href as a relative path instead of an external link.
function toAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

const PhoneIcon: React.FC = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const MailIcon: React.FC = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const WebsiteIcon: React.FC = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
  </svg>
);

const WhatsAppIcon: React.FC = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
  </svg>
);

export const VehicleDetails: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const { listing, isLoading } = useBuyerListing(listingId);
  const { t, tEnum } = useI18n();
  const hasContactBar = Boolean(listing?.dealer);
  useBodyClass('has-contact-bar', hasContactBar);

  // Remember this vehicle on this device for "Recommended for you".
  useEffect(() => { if (listing) recordRecentlyViewed(listing.id); }, [listing]);

  if (isLoading) {
    return <div role="status" aria-label={t('details.loading')} className="loading-spinner" style={{ margin: '6rem auto', display: 'block' }} />;
  }

  if (!listing) {
    return (
      <div style={{ maxWidth: 800, margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('details.notFoundTitle')}</h2>
        <p style={{ color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>{t('details.notFoundBody')}</p>
        <Link to="/marketplace" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>{t('details.back')}</Link>
      </div>
    );
  }

  const number = (value: number) => new Intl.NumberFormat('en-LK').format(value);
  const engineCapacityCc = getEngineCapacityCc(listing);
  const batteryCapacityKWh = getBatteryCapacityKWh(listing);
  const batteryRangeKm = getBatteryRangeKm(listing);
  const mileageKm = getMileageKm(listing);
  const specs: Array<[MessageKey, string | undefined]> = [
    ['spec.model', listing.model],
    ['spec.edition', getEdition(listing)],
    ['spec.bodyType', getBodyType(listing) && tEnum(getBodyType(listing))],
    ['spec.year', String(listing.year)],
    ['spec.condition', getCondition(listing) && tEnum(getCondition(listing))],
    ['spec.transmission', getTransmission(listing) && tEnum(getTransmission(listing))],
    ['spec.fuel', getFuelType(listing) && tEnum(getFuelType(listing))],
    ['spec.engine', engineCapacityCc !== undefined ? `${number(engineCapacityCc)} cc` : undefined],
    ['spec.battery', batteryCapacityKWh !== undefined ? `${batteryCapacityKWh} kWh` : undefined],
    ['spec.range', batteryRangeKm !== undefined ? `${number(batteryRangeKm)} km` : undefined],
    ['spec.mileage', mileageKm !== undefined ? `${number(mileageKm)} km` : undefined],
    ['spec.location', listing.location ?? '—'],
  ];

  const dealer = listing.dealer;
  const whatsApp = dealer ? whatsAppLink(dealer.phone, t('details.whatsappMessage', { title: listing.title })) : null;

  return (
    <div className="vehicle-details-page">
      <nav className="vehicle-breadcrumb" aria-label="Breadcrumb">
        <Link to="/marketplace">{t('details.breadcrumb')}</Link>
        <span aria-hidden="true">/</span>
        <span>{listing.make}</span>
        <span aria-hidden="true">/</span>
        <span className="vehicle-breadcrumb-current">{listing.title}</span>
      </nav>

      <div className="vehicle-details-layout">
        {/* Left Column — Gallery + Specs + Description */}
        <div className="vehicle-details-main">
          <ListingGallery images={listing.images} title={listing.title} />

          <div className="glass-card vehicle-section">
            <h3 className="vehicle-section-title">{t('details.specs')}</h3>
            <dl className="spec-grid">
              {specs.filter(([, value]) => value !== undefined && value !== '').map(([label, value]) => (
                <div key={label}>
                  <dt>{t(label)}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="glass-card vehicle-section">
            <h3 className="vehicle-section-title">{t('details.description')}</h3>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{listing.description}</p>
          </div>
        </div>

        {/* Right Column — Dealer Info & Contact */}
        <div className="vehicle-details-side">
          <div className="glass-card vehicle-summary-card">
            <h1 className="vehicle-title">{listing.title}</h1>
            <div className="vehicle-price">{formatPrice(listing.price, listing.currency)}</div>
            <CompareToggle listingId={listing.id} title={listing.title} />

            <div className="vehicle-dealer">
              <span className="vehicle-dealer-label">{t('details.soldBy')}</span>
              {dealer ? (
                <>
                  <h4 className="vehicle-dealer-name">{dealer.businessName}</h4>
                  <div className="vehicle-dealer-contacts">
                    <a href={`tel:${dealer.phone}`}><PhoneIcon /> {dealer.phone}</a>
                    {whatsApp && <a href={whatsApp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> {t('details.whatsapp')}</a>}
                    <a href={`mailto:${dealer.email}`}><MailIcon /> {dealer.email}</a>
                    {dealer.website && (
                      <a href={toAbsoluteUrl(dealer.website)} target="_blank" rel="noopener noreferrer"><WebsiteIcon /> {dealer.website.replace(/^https?:\/\//, '')}</a>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>{t('details.dealerUnavailable')}</p>
              )}
            </div>

            <div className="vehicle-listing-dates">
              <span>{listing.publishedAt ? t('details.listed', { date: formatDate(listing.publishedAt) }) : t('details.activeListing')}</span>
              {listing.lastConfirmedAt && <span>{t('details.confirmed', { date: formatDate(listing.lastConfirmedAt) })}</span>}
            </div>
          </div>
        </div>
      </div>

      <SimilarVehicles listingId={listing.id} />

      {/* Phones and tablets: the ways to reach the dealer stay one tap away while scrolling. */}
      {dealer && (
        <nav className="contact-bar" aria-label={t('details.contactBar')}>
          <a className="btn btn-secondary" href={`tel:${dealer.phone}`}><PhoneIcon /> {t('details.call')}</a>
          {whatsApp && <a className="btn btn-success" href={whatsApp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> {t('details.whatsapp')}</a>}
          <a className="btn btn-secondary" href={`mailto:${dealer.email}`}><MailIcon /> {t('details.email')}</a>
        </nav>
      )}
    </div>
  );
};
