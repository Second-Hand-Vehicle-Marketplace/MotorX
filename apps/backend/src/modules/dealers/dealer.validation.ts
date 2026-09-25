import { z } from 'zod';

export const createDealerApplicationSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  registrationNumber: z.string().trim().min(2).max(80).transform((value) => value.toUpperCase()),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(300),
  representativeName: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(100),
  province: z.string().trim().min(2).max(100),
  businessPhone: z.string().trim().min(7).max(30),
  businessEmail: z.string().trim().email().max(160),
  website: z.union([z.literal(''), z.string().trim().url().max(300)]).optional().transform((value) => value || undefined),
  dealershipType: z.enum(['new', 'used', 'both']),
  brands: z.union([z.array(z.string()), z.string()]).optional().transform((value) => {
    if (!value) return [];
    return (Array.isArray(value) ? value : value.split(',')).map((brand) => brand.trim()).filter(Boolean).slice(0, 30);
  }),
  description: z.string().trim().min(20).max(2000),
  inventoryCount: z.union([z.literal(''), z.coerce.number().int().min(0).max(100000)]).optional().transform((value) => value === '' ? undefined : value),
});

// Business details an approved dealer may change. Not included: businessName and
// registrationNumber, which were verified against documents during review.
export const updateDealerProfileSchema = z.object({
  representativeName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  province: z.string().trim().min(2).max(100),
  businessPhone: z.string().trim().min(7).max(30),
  businessEmail: z.string().trim().email().max(160),
  website: z.union([z.literal(''), z.string().trim().url().max(300)]),
  dealershipType: z.enum(['new', 'used', 'both']),
  brands: z.array(z.string().trim().min(1).max(60)).max(30),
  description: z.string().trim().min(20).max(2000),
  inventoryCount: z.coerce.number().int().min(0).max(100000),
}).partial().refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update.' });

export const dealerIdParamsSchema = z.object({ dealerId: z.string().regex(/^[a-f\d]{24}$/i) });
export const rejectionBodySchema = z.object({ reason: z.string().trim().min(3).max(500) });

export type CreateDealerApplicationBody = z.infer<typeof createDealerApplicationSchema>;
export type UpdateDealerProfileBody = z.infer<typeof updateDealerProfileSchema>;
