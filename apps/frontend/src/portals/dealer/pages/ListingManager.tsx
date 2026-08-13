import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockListings, formatPrice, formatMileage, formatDate } from '@/shared/mockData';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';
import type { ListingStatus } from '@/features/listings/types/listing.types';

export const ListingManager: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const dealerListings = mockListings.filter(l => l.dealerId === 'usr_002');

  const filteredListings = dealerListings.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q) || l.make.toLowerCase().includes(q) || l.model.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Inventory</h1>
          <p className="page-subtitle">View, edit, and update status for all your vehicle listings</p>
        </div>
        <Link to="/dealer/listings/new" className="btn btn-primary">
          + Add New Vehicle
        </Link>
      </div>

      {/* Filter controls */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by make, model, or title..."
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ width: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle Title</th>
                <th>Year</th>
                <th>Price</th>
                <th>Mileage</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map(listing => (
                <tr key={listing.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={listing.images[0]?.url}
                        alt=""
                        style={{ width: 44, height: 32, borderRadius: 4, objectFit: 'cover' }}
                      />
                      <span>{listing.title}</span>
                    </div>
                  </td>
                  <td>{listing.year}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>
                    {formatPrice(listing.price)}
                  </td>
                  <td>{formatMileage(listing.mileage)}</td>
                  <td><ListingStatusBadge status={listing.status} /></td>
                  <td>{formatDate(listing.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/marketplace/${listing.id}`} className="btn btn-ghost btn-sm">View</Link>
                      <button className="btn btn-secondary btn-sm">Edit</button>
                    </div>
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