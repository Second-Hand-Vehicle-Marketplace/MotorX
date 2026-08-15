import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buyerApi } from '../services/buyerApi';
import type { Listing, ListingFilters, PaginatedResponse } from '../../listings/types/listing.types';

const emptyResponse: PaginatedResponse<Listing> = { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };

// Groups marketplace filtering and pagination state for buyer screens.
export function useBuyerListings(initialFilters: ListingFilters = {}, pageSize = 9) {
  const [filters, setFilters] = useState(initialFilters); const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['buyer-listings', filters, page, pageSize], queryFn: () => buyerApi.listVehicles(filters, page, pageSize) });
  const updateFilters = (values: Partial<ListingFilters>) => { setFilters((current) => ({ ...current, ...values })); setPage(1); };
  const resetFilters = () => { setFilters({}); setPage(1); };
  return { ...query, data: query.data ?? emptyResponse, filters, updateFilters, resetFilters, page, setPage };
}
