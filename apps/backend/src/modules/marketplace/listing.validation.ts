import { z } from 'zod';
import {
  busAttributesSchema,
  carAttributesSchema,
  carBodyTypes,
  commonListingFieldsSchema,
  motorcycleAttributesSchema,
  threeWheelerAttributesSchema,
  truckAttributesSchema,
  vanAttributesSchema,
  vehicleCategories,
  vehicleConditions,
  vehicleDetailsSchema,
  type VehicleCategory,
} from '@motorx/shared-contracts';

const currentYear = new Date().getFullYear();

export const listListingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  make: z.string().trim().max(80).optional(),
  model: z.string().trim().max(80).optional(),
  yearMin: z.coerce.number().int().min(1900).optional(),
  yearMax: z.coerce.number().int().min(1900).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  category: z.enum(vehicleCategories).optional(),
  bodyType: z.enum(carBodyTypes).optional(),
  condition: z.enum(vehicleConditions).optional(),
  fuelType: z.string().trim().optional(),
  transmission: z.string().trim().optional(),
  sortBy: z.enum(['newest', 'price-asc', 'price-desc', 'year-desc', 'mileage-asc']).optional(),
});

// commonListingFieldsSchema + vehicleDetailsSchema (discriminated on category) come from
// @motorx/shared-contracts — the same pair the worker's CSV pipeline validates rows against.
export const createListingBodySchema = commonListingFieldsSchema
  .and(vehicleDetailsSchema)
  .and(z.object({ status: z.enum(['draft', 'active']).default('draft') }));

export const listingIdParamsSchema = z.object({ listingId: z.string().regex(/^[a-f\d]{24}$/i) });

// Category is immutable after creation. `attributes` is accepted loosely here (its exact shape
// depends on the listing's existing category, which is only known once loaded in the service),
// then re-validated in listing.service.ts against that category's strict attribute schema.
export const updateListingBodySchema = z.object({
  registrationNumber: z.string().trim().min(4).max(20).optional(),
  title: z.string().trim().min(3).max(160).optional(),
  make: z.string().trim().min(1).max(80).optional(),
  model: z.string().trim().min(1).max(80).optional(),
  year: z.coerce.number().int().min(1900).max(currentYear + 1).optional(),
  price: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
  location: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(5_000).nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
}).refine((body) => Object.keys(body).length > 0, 'At least one field is required.');

export const updateListingStatusBodySchema = z.object({ status: z.enum(['active', 'sold', 'archived']) });
const listingImageKeySchema = z.string().regex(/^[a-f\d]{24}-[0-9a-f-]{36}\.(jpg|png|webp)$/i);
export const listingImageKeyParamsSchema = listingIdParamsSchema.extend({ imageKey: listingImageKeySchema });
export const listingImageMetadataSchema = z.object({ alt: z.string().trim().max(200).optional() });
export const reorderListingImagesBodySchema = z.object({ imageKeys: z.array(z.string().trim().min(1)).min(1).max(30) });

// Re-validates a partial attributes patch against the listing's existing (immutable) category,
// merged onto its current attributes so a partial update can't drop required fields.
const attributeSchemasByCategory = {
  car: carAttributesSchema, motorcycle: motorcycleAttributesSchema, van: vanAttributesSchema,
  truck: truckAttributesSchema, three_wheeler: threeWheelerAttributesSchema, bus: busAttributesSchema,
  other: z.object({}).passthrough(),
} satisfies Record<VehicleCategory, z.ZodTypeAny>;

export function validateAttributesForCategory(category: VehicleCategory, mergedAttributes: unknown) {
  return attributeSchemasByCategory[category].safeParse(mergedAttributes);
}

export type ListListingsQuery = z.infer<typeof listListingsQuerySchema>;
export type CreateListingBody = z.infer<typeof createListingBodySchema>;
export type UpdateListingBody = z.infer<typeof updateListingBodySchema>;
