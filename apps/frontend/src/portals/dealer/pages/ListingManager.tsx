import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LISTING_IMAGE_ASPECT_RATIO } from '@motorx/shared-contracts';
import { listingApi } from '@/features/listings/services/listingApi';
import { formatMileage, formatPrice } from '@/shared/utils/formatters';
import { getMileageKm } from '@/features/listings/utils/vehicleAttributes';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';

const TABLE_THUMB_WIDTH = 44;
const TABLE_THUMB_HEIGHT = Math.round(TABLE_THUMB_WIDTH / LISTING_IMAGE_ASPECT_RATIO);

export const ListingManager: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const statsQuery = useQuery({ queryKey: ['my-listing-stats'], queryFn: () => listingApi.getMyListingStats() });
  const query = useQuery({ queryKey: ['my-listings', page, search, statusFilter, view], queryFn: () => listingApi.getMyListings(page, 20, { search: search.trim() || undefined, status: view === 'archived' ? 'archived' : statusFilter === 'all' ? undefined : statusFilter }) });
  const listings = query.data?.data ?? [];
  const totalPages = query.data?.totalPages ?? 1;

  const changeStatus = async (id: string, status: 'active' | 'sold' | 'archived') => {
    await listingApi.updateListingStatus(id, { status });
    await queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    await queryClient.invalidateQueries({ queryKey: ['listings'] });
  };

  const deleteVehicle = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    await listingApi.deleteListing(id);
    await queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    await queryClient.invalidateQueries({ queryKey: ['listings'] });
  };

  return <div>
    <div className="page-header"><div><h1 className="page-title">Manage Inventory</h1><p className="page-subtitle">Review, edit, and publish your vehicle listings.</p></div><Link to="/dealer/listings/new" className="btn btn-primary">+ Add New Vehicle</Link></div>
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
      <button className={`btn btn-sm ${view === 'active' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setView('active'); setPage(1); }}>My Listings</button>
      <button className={`btn btn-sm ${view === 'archived' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setView('archived'); setPage(1); }}>Archived ({statsQuery.data?.archived ?? '—'})</button>
    </div>
    <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}><input className="form-input" placeholder="Search listings…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />{view === 'active' && <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}><option value="all">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="sold">Sold</option></select>}</div>
    {query.isLoading && <div className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />}
    {query.isError && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)' }}>Could not load your listings.</div>}
    {!query.isLoading && !query.isError && <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}><div className="table-container"><table className="data-table"><thead><tr><th>Vehicle</th><th>Year</th><th>Price</th><th>Mileage</th><th>Status</th><th>Actions</th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id}><td><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>{listing.images[0]?.url && <img src={listing.images[0].url} alt="" style={{ width: TABLE_THUMB_WIDTH, height: TABLE_THUMB_HEIGHT, borderRadius: 4, objectFit: 'cover' }} />}<strong>{listing.title}</strong></div></td><td>{listing.year}</td><td>{formatPrice(listing.price, listing.currency)}</td><td>{formatMileage(getMileageKm(listing) ?? 0)}</td><td><ListingStatusBadge status={listing.status} /></td><td><div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><Link to={`/dealer/listings/${listing.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>{listing.status === 'active' && <Link to={`/marketplace/${listing.id}`} className="btn btn-ghost btn-sm">Preview</Link>}{listing.status === 'draft' && <button className="btn btn-success btn-sm" onClick={() => void changeStatus(listing.id, 'active')}>Publish</button>}{listing.status === 'active' && <button className="btn btn-secondary btn-sm" onClick={() => void changeStatus(listing.id, 'sold')}>Mark sold</button>}{listing.status !== 'archived' && <button className="btn btn-danger btn-sm" onClick={() => void changeStatus(listing.id, 'archived')}>Archive</button>}{listing.status === 'archived' && <button className="btn btn-danger btn-sm" onClick={() => void deleteVehicle(listing.id, listing.title)}>Delete</button>}</div></td></tr>)}</tbody></table>{listings.length === 0 && <div className="empty-state"><p>{view === 'archived' ? 'No archived listings.' : 'No listings found.'}</p></div>}<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}><button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></div></div>}
  </div>;
};
