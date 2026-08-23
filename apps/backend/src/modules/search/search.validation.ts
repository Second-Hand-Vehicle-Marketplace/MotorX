import { z } from 'zod';
import { carBodyTypes, fuelTypes, transmissionTypes, vehicleCategories, vehicleConditions } from '@motorx/shared-contracts';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20),
  make: z.string().trim().max(80).optional(), model: z.string().trim().max(80).optional(), location: z.string().trim().min(2).max(120).optional(),
  yearMin: z.coerce.number().int().min(1900).optional(), yearMax: z.coerce.number().int().min(1900).optional(),
  priceMin: z.coerce.number().nonnegative().optional(), priceMax: z.coerce.number().nonnegative().optional(),
  mileageMin: z.coerce.number().nonnegative().optional(), mileageMax: z.coerce.number().nonnegative().optional(),
  category: z.enum(vehicleCategories).optional(), bodyType: z.enum(carBodyTypes).optional(), condition: z.enum(vehicleConditions).optional(),
  fuelType: z.enum(fuelTypes).optional(), transmission: z.enum(transmissionTypes).optional(),
  sortBy: z.enum(['relevance', 'newest', 'price-asc', 'price-desc', 'year-desc', 'mileage-asc']).default('relevance'),
}).superRefine((query, context) => {
  for (const [minimumName, minimum, maximumName, maximum] of [
    ['yearMin', query.yearMin, 'yearMax', query.yearMax], ['priceMin', query.priceMin, 'priceMax', query.priceMax], ['mileageMin', query.mileageMin, 'mileageMax', query.mileageMax],
  ] as const) if (minimum !== undefined && maximum !== undefined && minimum > maximum) context.addIssue({ code: z.ZodIssueCode.custom, path: [maximumName], message: `${maximumName} must be greater than or equal to ${minimumName}.` });
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
