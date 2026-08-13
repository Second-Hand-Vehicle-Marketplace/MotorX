import { z } from 'zod';
import { fuelTypes, transmissionTypes } from '@motorx/shared-contracts';

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

export const updateListingBodySchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  make: z.string().trim().min(1).max(80).optional(),
  model: z.string().trim().min(1).max(80).optional(),
  year: z.coerce.number().int().min(1900).max(currentYear + 1).optional(),
  price: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
  mileageKm: z.coerce.number().nonnegative().optional(),
  fuelType: z.enum(fuelTypes).optional(),
  transmission: z.enum(transmissionTypes).optional(),
  location: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(5_000).nullable().optional(),
}).refine((body) => Object.keys(body).length > 0, 'At least one field is required.');

export const updateListingStatusBodySchema = z.object({ status: z.enum(['active', 'sold', 'archived']) });
const listingImageKeySchema = z.string().regex(/^[a-f\d]{24}-[0-9a-f-]{36}\.(jpg|png|webp)$/i);
export const listingImageKeyParamsSchema = listingIdParamsSchema.extend({ imageKey: listingImageKeySchema });
export const listingImageMetadataSchema = z.object({ alt: z.string().trim().max(200).optional() });
export const reorderListingImagesBodySchema = z.object({ imageKeys: z.array(z.string().trim().min(1)).min(1).max(30) });

export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
export type CreateListingBody = z.infer<typeof createListingBodySchema>;
export type UpdateListingBody = z.infer<typeof updateListingBodySchema>;
