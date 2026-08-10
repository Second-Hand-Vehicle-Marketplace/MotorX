import { useState, useEffect } from 'react';
import type { Listing } from '../types/listing.types';
import { mockListings } from '../../../shared/mockData';

export function useListing(id?: string) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setListing(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const found = mockListings.find(l => l.id === id) || null;
      setListing(found);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [id]);

  return { listing, isLoading };
}