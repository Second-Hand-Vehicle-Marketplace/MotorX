import { useState, useMemo } from 'react';
import type { Listing, ListingFilters, PaginatedResponse } from '../types/listing.types';
import { mockListings } from '../../../shared/mockData';

export function useListings(initialFilters: ListingFilters = {}, pageSize = 9) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [page, setPage] = useState(1);

  const filteredListings = useMemo(() => {
    return mockListings.filter(listing => {
      if (filters.make && listing.make.toLowerCase() !== filters.make.toLowerCase()) return false;
      if (filters.bodyType && listing.bodyType !== filters.bodyType) return false;
      if (filters.fuelType && listing.fuelType !== filters.fuelType) return false;
      if (filters.transmission && listing.transmission !== filters.transmission) return false;
      if (filters.status && listing.status !== filters.status) return false;
      if (filters.yearMin && listing.year < filters.yearMin) return false;
      if (filters.yearMax && listing.year > filters.yearMax) return false;
      if (filters.priceMin && listing.price < filters.priceMin) return false;
      if (filters.priceMax && listing.price > filters.priceMax) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = listing.title.toLowerCase().includes(query);
        const matchMake = listing.make.toLowerCase().includes(query);
        const matchModel = listing.model.toLowerCase().includes(query);
        const matchDesc = listing.description.toLowerCase().includes(query);
        if (!matchTitle && !matchMake && !matchModel && !matchDesc) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'year-desc': return b.year - a.year;
        case 'mileage-asc': return a.mileage - b.mileage;
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [filters]);

  const totalPages = Math.ceil(filteredListings.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredListings.slice(start, start + pageSize);
  }, [filteredListings, page, pageSize]);

  const response: PaginatedResponse<Listing> = {
    data: paginatedData,
    total: filteredListings.length,
    page,
    pageSize,
    totalPages,
  };

  const updateFilters = (newFilters: Partial<ListingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
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
    isLoading: false,
  };
}