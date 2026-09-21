import { describe, expect, it } from 'vitest';
import { listAdminListingsQuerySchema, listAdminUsersQuerySchema, updateAdminUserBodySchema } from './admin.validation.js';

describe('admin validation', () => {
  it('applies bounded pagination defaults to admin collections', () => {
    expect(listAdminUsersQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(listAdminListingsQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
  });

  it('accepts supported user filters', () => {
    expect(listAdminUsersQuerySchema.parse({ page: '2', limit: '50', role: 'dealer', status: 'suspended' })).toEqual({
      page: 2, limit: 50, role: 'dealer', status: 'suspended',
    });
  });

  it('accepts supported listing filters', () => {
    expect(listAdminListingsQuerySchema.parse({ status: 'active', search: 'Toyota', page: '2' })).toEqual({
      status: 'active', search: 'Toyota', page: 2, limit: 20,
    });
  });

  it('rejects unsupported status values', () => {
    expect(updateAdminUserBodySchema.safeParse({ status: 'deleted' }).success).toBe(false);
    expect(listAdminListingsQuerySchema.safeParse({ status: 'removed' }).success).toBe(false);
  });
});
