import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buyerApi } from '@/features/buyers/services/buyerApi';
import { ListingCard } from '@/features/listings/components/ListingCard';
import type { Listing } from '@/features/listings/types/listing.types';
import { useI18n } from '@/shared/i18n/useI18n';
import { clearRecentlyViewed, getRecentlyViewed } from './recentlyViewed';

// A titled row of vehicle cards. On phones the row scrolls sideways instead of stacking, so it
// never pushes the main results far down the page.
const SuggestionRow: React.FC<{ id: string; title: string; subtitle: string; listings: Listing[]; action?: React.ReactNode }> = ({ id, title, subtitle, listings, action }) => (
  <section className="suggestion-section" aria-labelledby={id}>
    <div className="suggestion-header">
      <div>
        <h2 id={id} className="suggestion-title">{title}</h2>
        <p className="suggestion-subtitle">{subtitle}</p>
      </div>
      {action}
    </div>
    <div className="suggestion-row">
      {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
    </div>
  </section>
);

// "Recommended for you": shown only once this browser has viewed some vehicles, and only when the
// server found matches. Failures hide the section; it is a bonus, never a blocker.
export const RecommendedVehicles: React.FC<{ limit?: number }> = ({ limit = 8 }) => {
  const { t } = useI18n();
  const [viewed, setViewed] = useState(getRecentlyViewed);
  const query = useQuery({ queryKey: ['recommendations', viewed, limit], queryFn: () => buyerApi.getRecommendedVehicles(viewed, limit), enabled: viewed.length > 0, staleTime: 60_000 });
  if (!viewed.length || !query.data?.length) return null;
  const clear = () => { clearRecentlyViewed(); setViewed([]); };
  return <SuggestionRow id="recommended-title" title={t('recommended.title')} subtitle={t('recommended.subtitle')} listings={query.data}
    action={<button type="button" className="btn btn-ghost btn-sm" onClick={clear}>{t('recommended.clear')}</button>} />;
};

// "Similar vehicles" under a listing.
export const SimilarVehicles: React.FC<{ listingId: string; limit?: number }> = ({ listingId, limit = 6 }) => {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ['similar-vehicles', listingId, limit], queryFn: () => buyerApi.getSimilarVehicles(listingId, limit), staleTime: 60_000 });
  if (!query.data?.length) return null;
  return <SuggestionRow id="similar-title" title={t('similar.title')} subtitle={t('similar.subtitle')} listings={query.data} />;
};
