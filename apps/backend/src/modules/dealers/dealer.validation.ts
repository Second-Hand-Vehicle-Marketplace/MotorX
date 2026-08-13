import { z } from 'zod';

export const createDealerApplicationSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  registrationNumber: z.string().trim().min(2).max(80).transform((value) => value.toUpperCase()),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(300),
});

export const dealerIdParamsSchema = z.object({ dealerId: z.string().regex(/^[a-f\d]{24}$/i) });
export const rejectionBodySchema = z.object({ reason: z.string().trim().min(3).max(500) });

export type CreateDealerApplicationBody = z.infer<typeof createDealerApplicationSchema>;
