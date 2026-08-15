import { z } from 'zod';
import { vehicleCategories } from '@motorx/shared-contracts';

// Shared pagination rules keep every admin collection bounded.
const adminPaginationSchema = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const listAdminUsersQuerySchema = z.object({
  ...adminPaginationSchema,
  search: z.string().trim().max(120).optional(),
  role: z.enum(['buyer', 'dealer', 'admin']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

export const adminUserIdParamsSchema = z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i) });
export const updateAdminUserBodySchema = z.object({ status: z.enum(['active', 'suspended']) });

export const listAdminListingsQuerySchema = z.object({
  ...adminPaginationSchema,
  search: z.string().trim().max(160).optional(),
  status: z.enum(['draft', 'active', 'sold', 'archived']).optional(),
  category: z.enum(vehicleCategories).optional(),
});

export const adminListingIdParamsSchema = z.object({ listingId: z.string().regex(/^[a-f\d]{24}$/i) });
export const adminDealerIdParamsSchema = z.object({ dealerId: z.string().regex(/^[a-f\d]{24}$/i) });
export const adminDealerDocumentParamsSchema = adminDealerIdParamsSchema.extend({ documentIndex: z.coerce.number().int().min(0).max(2) });
export const rejectDealerApplicationBodySchema = z.object({ reason: z.string().trim().min(3).max(500) });

export const listAdminAuditQuerySchema = z.object({
  ...adminPaginationSchema,
  eventType: z.enum(['dealer_approved', 'dealer_rejected', 'user_suspended', 'user_activated', 'listing_removed']).optional(),
});

export const listAdminUploadsQuerySchema = z.object({
  ...adminPaginationSchema,
  status: z.enum(['pending', 'processing', 'completed', 'completedWithErrors', 'failed']).optional(),
});

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;
export type ListAdminListingsQuery = z.infer<typeof listAdminListingsQuerySchema>;
export type ListAdminAuditQuery = z.infer<typeof listAdminAuditQuerySchema>;
export type ListAdminUploadsQuery = z.infer<typeof listAdminUploadsQuerySchema>;
