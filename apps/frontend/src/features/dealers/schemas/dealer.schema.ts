import { z } from 'zod';
import { dealerApplicationStatuses } from '@motorx/shared-contracts';

export const dealerApplicationSchema = z.object({
  id: z.string(), userId: z.string(), businessName: z.string(), registrationNumber: z.string(),
  phone: z.string(), address: z.string(), representativeName: z.string(), city: z.string(), province: z.string(),
  businessPhone: z.string(), businessEmail: z.string(), website: z.string().nullable(),
  dealershipType: z.enum(['new', 'used', 'both']), brands: z.array(z.string()), description: z.string(),
  inventoryCount: z.number().nullable(),
  verificationDocuments: z.array(z.object({ category: z.enum(['businessRegistration', 'identityProof', 'additionalDocument']), key: z.string(), originalName: z.string(), contentType: z.string(), size: z.number() })),
  status: z.enum(dealerApplicationStatuses),
  rejectionReason: z.string().nullable(), reviewedBy: z.string().nullable(), reviewedAt: z.string().nullable(),
  createdAt: z.string(), updatedAt: z.string(),
});
export const dealerResponseSchema = z.object({ success: z.literal(true), data: dealerApplicationSchema, meta: z.null() });
export const dealerListResponseSchema = z.object({ success: z.literal(true), data: z.array(dealerApplicationSchema), meta: z.null() });
