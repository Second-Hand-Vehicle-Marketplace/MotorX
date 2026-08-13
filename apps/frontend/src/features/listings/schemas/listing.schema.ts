import { z } from 'zod';

export const listingSchema = z.object({
  id: z.string(),
  dealerId: z.string(),
  title: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  mileageKm: z.number().nonnegative(),
  fuelType: z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'other']),
  transmission: z.enum(['automatic', 'manual', 'other']),
  location: z.string(),
  description: z.string().nullable(),
  images: z.array(z.object({ key: z.string(), url: z.string(), alt: z.string().nullable(), order: z.number() })),
  status: z.enum(['draft', 'active', 'sold', 'archived']),
  publishedAt: z.string().nullable(),
});

export const listingsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(listingSchema),
  meta: z.object({
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  }),
});
