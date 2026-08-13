import { z } from 'zod';
import { dealerApplicationStatuses } from '@motorx/shared-contracts';

export const dealerApplicationSchema = z.object({
  id: z.string(), userId: z.string(), businessName: z.string(), registrationNumber: z.string(),
  phone: z.string(), address: z.string(), status: z.enum(dealerApplicationStatuses),
  rejectionReason: z.string().nullable(), reviewedBy: z.string().nullable(), reviewedAt: z.string().nullable(),
  createdAt: z.string(), updatedAt: z.string(),
});
export const dealerResponseSchema = z.object({ success: z.literal(true), data: dealerApplicationSchema, meta: z.null() });
export const dealerListResponseSchema = z.object({ success: z.literal(true), data: z.array(dealerApplicationSchema), meta: z.null() });
