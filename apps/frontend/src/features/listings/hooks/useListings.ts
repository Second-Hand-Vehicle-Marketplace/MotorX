import { useState, useEffect } from 'react';
import type { Listing, ListingFilters, PaginatedResponse } from '../types/listing.types';
import { listingApi } from '../services/listingApi';

export function useListings(initialFilters: ListingFilters = {}, pageSize = 9) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<PaginatedResponse<Listing>>({
    data: [],
    total: 0,
    page: 1,
    pageSize,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    listingApi
      .getListings({ ...filters, page, pageSize })
      .then((result) => {
        if (active) setResponse(result);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, page, pageSize]);

  const updateFilters = (newFilters: Partial<ListingFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({});
    setPage(1);
  };

  return {
    data: response,
    filters,
    updateFilters,
    resetFilters,
    page,
    setPage,
    isLoading,
  };
}