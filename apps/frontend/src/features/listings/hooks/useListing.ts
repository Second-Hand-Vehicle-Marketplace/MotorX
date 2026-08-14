import { useQuery } from '@tanstack/react-query';
import { listingApi } from '../services/listingApi';

export function useListing(id?: string) {
  const query = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingApi.getListingById(id!),
    enabled: Boolean(id),
  });

  return { ...query, listing: query.data ?? null };
}
