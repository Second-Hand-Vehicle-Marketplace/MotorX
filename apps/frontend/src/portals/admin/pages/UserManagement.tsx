import React, { useCallback, useEffect, useState } from 'react';
import { adminApi, type AdminUser } from '@/features/admin/services/adminApi';
import type { UserRole } from '@/features/auth/types/auth.types';
import { formatDate } from '@/shared/utils/formatters';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [role, setRole] = useState<UserRole | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Reload when an applied server-side filter changes.
  const loadUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await adminApi.listUsers({ search: search || undefined, role: role || undefined, limit: 100 });
      setUsers(result.users);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load users.');
    } finally { setLoading(false); }
  }, [role, search]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  // Replace only the changed row so current filters remain intact.
  async function toggleStatus(user: AdminUser) {
    setUpdatingId(user.id); setError('');
    try {
      const updated = await adminApi.setUserStatus(user.id, user.status === 'active' ? 'suspended' : 'active');
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update the user.');
    } finally { setUpdatingId(null); }
  }

  return <div>
    <div className="page-header"><div><h1 className="page-title">User Accounts</h1><p className="page-subtitle">Manage platform accounts and access suspensions</p></div></div>
    {error && <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>}
    <form className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }} onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }}>
      <input type="search" className="form-input" placeholder="Search by name or email..." style={{ width: 280 }} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
      <select className="form-select" style={{ width: 160 }} value={role} onChange={(event) => setRole(event.target.value as UserRole | '')}>
        <option value="">All Roles</option><option value="buyer">Buyers</option><option value="dealer">Dealers</option><option value="admin">Admins</option>
      </select>
      <button className="btn btn-secondary" type="submit">Search</button>
    </form>
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}><div className="table-container"><table className="data-table">
      <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Created Date</th><th>Last Login</th><th>Actions</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan={6}>Loading users...</td></tr>}
        {!loading && users.length === 0 && <tr><td colSpan={6}>No users match these filters.</td></tr>}
        {!loading && users.map((user) => <tr key={user.id}>
          <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}><div>{user.displayName || 'Unnamed user'}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>{user.email}</div></td>
          <td><span className={`badge ${user.role === 'admin' ? 'badge-warning' : user.role === 'dealer' ? 'badge-info' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{user.role}</span></td>
          <td><span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-error'}`}>{user.status === 'active' ? 'Active' : 'Suspended'}</span></td>
          <td>{formatDate(user.createdAt)}</td><td>{formatDate(user.lastLoginAt)}</td>
          <td><button disabled={updatingId === user.id} onClick={() => void toggleStatus(user)} className={`btn btn-sm ${user.status === 'active' ? 'btn-danger' : 'btn-success'}`}>{updatingId === user.id ? 'Saving...' : user.status === 'active' ? 'Suspend' : 'Activate'}</button></td>
        </tr>)}
      </tbody>
    </table></div></div>
  </div>;
};
