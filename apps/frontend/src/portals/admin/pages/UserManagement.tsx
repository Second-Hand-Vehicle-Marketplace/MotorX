import React, { useState } from 'react';
import { mockUsers, formatDate } from '@/shared/mockData';
import type { UserRole } from '@/features/auth/types/auth.types';

export const UserManagement: React.FC = () => {
  const [usersList, setUsersList] = useState(mockUsers);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const toggleUserStatus = (id: string) => {
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const filteredUsers = usersList.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Accounts</h1>
          <p className="page-subtitle">Manage platform accounts, roles, and access suspensions</p>
        </div>
      </div>

      {/* Filter controls */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name or email..."
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ width: 160 }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="buyer">Buyers</option>
          <option value="dealer">Dealers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    <div>
                      <div>{user.displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>{user.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-warning' : user.role === 'dealer' ? 'badge-info' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.lastLoginAt)}</td>
                  <td>
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                    >
                      {user.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};