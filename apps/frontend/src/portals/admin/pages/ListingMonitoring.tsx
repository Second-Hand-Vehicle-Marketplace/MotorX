import React, { useCallback, useEffect, useState } from 'react';
import { adminApi, type AdminListing } from '@/features/admin/services/adminApi';
import { formatDate, formatPrice } from '@/shared/utils/formatters';

export const ListingMonitoring: React.FC = () => {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [status, setStatus] = useState<AdminListing['status'] | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Reload the server-backed table when an applied moderation filter changes.
  const loadListings = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await adminApi.listListings({ search: search || undefined, status: status || undefined, limit: 100 });
      setListings(result.listings);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load listings.');
    } finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { void loadListings(); }, [loadListings]);

  async function removeListing(listing: AdminListing) {
    if (!window.confirm(`Archive "${listing.title}"?`)) return;
    setRemovingId(listing.id); setError('');
    try {
      const updated = await adminApi.removeListing(listing.id);
      // Keep archived records visible unless the active filter excludes them.
      setListings((current) => status && status !== 'archived'
        ? current.filter((item) => item.id !== updated.id)
        : current.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to archive the listing.');
    } finally { setRemovingId(null); }
  }

  return <div>
    <div className="page-header"><div><h1 className="page-title">Listings Oversight</h1><p className="page-subtitle">Monitor and moderate vehicle listings across all dealerships</p></div></div>
    {error && <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>}
    <form className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }} onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }}>
      <input type="search" className="form-input" placeholder="Search by title, make, or model..." style={{ maxWidth: 360 }} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
      <select className="form-select" style={{ width: 160 }} value={status} onChange={(event) => setStatus(event.target.value as AdminListing['status'] | '')}>
        <option value="">All Statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="sold">Sold</option><option value="archived">Archived</option>
      </select>
      <button className="btn btn-secondary" type="submit">Search</button>
    </form>
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}><div className="table-container"><table className="data-table">
      <thead><tr><th>Listing</th><th>Dealer</th><th>Price</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan={6}>Loading listings...</td></tr>}
        {!loading && listings.length === 0 && <tr><td colSpan={6}>No listings match these filters.</td></tr>}
        {!loading && listings.map((listing) => <tr key={listing.id}>
          <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{listing.title}<div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>{listing.year} {listing.make} {listing.model}</div></td>
          <td>{listing.dealerName}</td><td style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>{formatPrice(listing.price, listing.currency)}</td>
          <td><span className={`badge ${listing.status === 'active' ? 'badge-success' : listing.status === 'archived' ? 'badge-error' : 'badge-neutral'}`}>{listing.status}</span></td>
          <td>{formatDate(listing.createdAt)}</td>
          <td><button disabled={listing.status === 'archived' || removingId === listing.id} onClick={() => void removeListing(listing)} className="btn btn-danger btn-sm">{removingId === listing.id ? 'Archiving...' : listing.status === 'archived' ? 'Archived' : 'Remove Listing'}</button></td>
        </tr>)}
      </tbody>
    </table></div></div>
  </div>;
};
