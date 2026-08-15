import { z } from 'zod';
import { vehicleDetailsSchema } from './attributeSchemas.js';

// Fields shared by every vehicle category, whether the listing was created through the manual
// dealer form or a bulk CSV row. `status` is intentionally excluded here: CSV imports always
// land as 'draft' (see the worker's persist step), while the manual form lets the dealer choose.
export const commonListingFieldsSchema = z.object({
  registrationNumber: z.string().trim().min(4).max(20),
  title: z.string().trim().min(3).max(160),
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.coerce.number().nonnegative(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default('LKR'),
  location: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5_000).optional(),
});

// One full listing row: common fields intersected with the category-discriminated attributes.
// Reused by the backend's manual listing form and the worker's CSV pipeline so a car's fuel-type
// rules (for example) can never drift between the two entry points.
export const listingRowSchema = commonListingFieldsSchema.and(vehicleDetailsSchema);
export type ListingRowInput = z.infer<typeof listingRowSchema>;
