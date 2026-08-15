import { useQuery } from '@tanstack/react-query';
import { buyerApi } from '../services/buyerApi';

// Loads one buyer-visible listing only when an ID is available.
export function useBuyerListing(id?: string) { const query = useQuery({ queryKey: ['buyer-listing', id], queryFn: () => buyerApi.getVehicle(id!), enabled: Boolean(id) }); return { ...query, listing: query.data ?? null }; }
