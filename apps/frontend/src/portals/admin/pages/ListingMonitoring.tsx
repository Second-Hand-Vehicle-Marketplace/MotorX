import React, { useState } from 'react';
import { mockListings, formatPrice, formatDate } from '@/shared/mockData';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';

export const ListingMonitoring: React.FC = () => {
  const [listings, setListings] = useState(mockListings);
  const [search, setSearch] = useState('');

  const handleRemove = (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const filtered = listings.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.title.toLowerCase().includes(q) || l.dealerName.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Listings Oversight</h1>
          <p className="page-subtitle">Monitor and moderate all active vehicle listings across all dealerships</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search listings by title or dealer name..."
          style={{ maxWidth: 360 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Dealer</th>
                <th>Price</th>
                <th>Status</th>
                <th>Views</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(listing => (
                <tr key={listing.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{listing.title}</td>
                  <td>{listing.dealerName}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>{formatPrice(listing.price)}</td>
                  <td><ListingStatusBadge status={listing.status} /></td>
                  <td>{listing.views}</td>
                  <td>{formatDate(listing.createdAt)}</td>
                  <td>
                    <button onClick={() => handleRemove(listing.id)} className="btn btn-danger btn-sm">
                      Remove Listing
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