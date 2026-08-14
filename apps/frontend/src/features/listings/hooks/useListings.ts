import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listingApi } from '../services/listingApi';
import type { ListingFilters, PaginatedResponse, Listing } from '../types/listing.types';

const emptyResponse: PaginatedResponse<Listing> = {
  data: [], total: 0, page: 1, pageSize: 20, totalPages: 0,
};

export function useListings(initialFilters: ListingFilters = {}, pageSize = 9) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['listings', filters, page, pageSize],
    queryFn: () => listingApi.getListings(filters, page, pageSize),
  });

  const updateFilters = (newFilters: Partial<ListingFilters>) => {
    setFilters((current) => ({ ...current, ...newFilters }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({});
    setPage(1);
  };

  return {
    ...query,
    data: query.data ?? emptyResponse,
    filters,
    updateFilters,
    resetFilters,
    page,
    setPage,
  };
}
