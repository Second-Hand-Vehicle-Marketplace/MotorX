import { useState, useEffect } from 'react';
import type { Listing } from '../types/listing.types';
import { listingApi } from '../services/listingApi';

export function useListing(id?: string) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setListing(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    listingApi
      .getListingById(id)
      .then((result) => {
        if (active) setListing(result);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return { listing, isLoading };
}