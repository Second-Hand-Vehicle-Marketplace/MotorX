import { z } from 'zod';

export { listingIdParamsSchema as buyerListingIdParamsSchema, listListingsQuerySchema as listBuyerListingsQuerySchema } from '../marketplace/listing.validation.js';
export type { ListListingsQuery as ListBuyerListingsQuery } from '../marketplace/listing.validation.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export const similarListingsQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(12).default(6) });

// `viewed` is a comma-separated list of listing IDs, most recently viewed first (at most 12).
export const recommendationsQuerySchema = z.object({
  viewed: z.string().trim().max(12 * 25)
    .transform((value) => [...new Set(value.split(',').map((id) => id.trim()).filter(Boolean))])
    .pipe(z.array(objectIdSchema).max(12)),
  limit: z.coerce.number().int().min(1).max(12).default(8),
});

export type SimilarListingsQuery = z.infer<typeof similarListingsQuerySchema>;
export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;
