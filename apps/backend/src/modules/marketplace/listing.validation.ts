import { z } from 'zod';

export const listListingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const currentYear = new Date().getFullYear();

export const createListingBodySchema = z.object({
  title: z.string().trim().min(3).max(160),
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1900).max(currentYear + 1),
  price: z.coerce.number().nonnegative(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default('LKR'),
  mileageKm: z.coerce.number().nonnegative(),
  fuelType: z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'other']),
  transmission: z.enum(['automatic', 'manual', 'other']),
  location: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5_000).optional(),
  status: z.enum(['draft', 'active']).default('draft'),
});

export const listingIdParamsSchema = z.object({ listingId: z.string().regex(/^[a-f\d]{24}$/i) });

export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
export type CreateListingBody = z.infer<typeof createListingBodySchema>;
