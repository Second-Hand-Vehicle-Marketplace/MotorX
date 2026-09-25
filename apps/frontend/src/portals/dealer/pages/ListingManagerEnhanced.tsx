import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LISTING_IMAGE_ASPECT_RATIO, vehicleCategories, type VehicleCategory } from '@motorx/shared-contracts';
import { listingApi } from '@/features/listings/services/listingApi';
import { formatMileage, formatPrice } from '@/shared/utils/formatters';
import { getMileageKm } from '@/features/listings/utils/vehicleAttributes';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';

const TABLE_THUMB_WIDTH = 44;
const TABLE_THUMB_HEIGHT = Math.round(TABLE_THUMB_WIDTH / LISTING_IMAGE_ASPECT_RATIO);

export const ListingManagerEnhanced: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<VehicleCategory | 'all'>('all');
  const [view, setView] = useState<'active' | 'archived'>('active');
  const [page, setPage] = useState(1);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const queryClient = useQueryClient();
  const statsQuery = useQuery({ queryKey: ['my-listing-stats'], queryFn: () => listingApi.getMyListingStats() });
  const query = useQuery({
    queryKey: ['my-listings', page, search, statusFilter, categoryFilter, view],
    queryFn: () => listingApi.getMyListings(page, 20, {
      search: search.trim() || undefined,
      status: view === 'archived' ? 'archived' : statusFilter === 'all' ? undefined : statusFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
    }),
  });
  const listings = query.data?.data ?? [];
  const totalPages = query.data?.totalPages ?? 1;

  const refreshInventory = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
    queryClient.invalidateQueries({ queryKey: ['my-listing-stats'] }),
    queryClient.invalidateQueries({ queryKey: ['listings'] }),
  ]);

  const changeStatus = async (id: string, status: 'active' | 'sold' | 'archived') => {
    if (pendingActionId) return;
    setPendingActionId(id); setActionError(''); setActionMessage('');
    try {
      await listingApi.updateListingStatus(id, { status });
      await refreshInventory();
      setActionMessage(`Listing marked as ${status}.`);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Could not update the listing.');
    } finally { setPendingActionId(null); }
  };

  const deleteVehicle = async (id: string, title: string) => {
    if (pendingActionId || !window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    setPendingActionId(id); setActionError(''); setActionMessage('');
    try {
      await listingApi.deleteListing(id);
      await refreshInventory();
      setActionMessage(`Deleted ${title}.`);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Could not delete the listing.');
    } finally { setPendingActionId(null); }
  };

  return <div>
    <div className="page-header"><div><h1 className="page-title">Manage Inventory</h1><p className="page-subtitle">Review, edit, and publish your vehicle listings.</p></div><Link to="/dealer/listings/new" className="btn btn-primary">+ Add New Vehicle</Link></div>
    {actionError && <div role="alert" className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)', marginBottom: '1rem' }}>{actionError}</div>}
    {actionMessage && <div role="status" className="glass-card" style={{ padding: '1rem', color: 'var(--color-success)', marginBottom: '1rem' }}>{actionMessage}</div>}
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}><button className={`btn btn-sm ${view === 'active' ? 'btn-primary' : 'btn-ghost'}`} disabled={Boolean(pendingActionId)} onClick={() => { setView('active'); setPage(1); }}>My Listings</button><button className={`btn btn-sm ${view === 'archived' ? 'btn-primary' : 'btn-ghost'}`} disabled={Boolean(pendingActionId)} onClick={() => { setView('archived'); setPage(1); }}>Archived ({statsQuery.data?.archived ?? '—'})</button></div>
    <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}><input className="form-input" placeholder="Search listings…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><select className="form-select" value={statusFilter} disabled={view === 'archived' || Boolean(pendingActionId)} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="all">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="sold">Sold</option></select><select className="form-select" value={categoryFilter} disabled={Boolean(pendingActionId)} onChange={(event) => { setCategoryFilter(event.target.value as VehicleCategory | 'all'); setPage(1); }}><option value="all">All categories</option>{vehicleCategories.filter((category) => category !== 'other').map((category) => <option key={category} value={category}>{category.replace('_', ' ')}</option>)}</select></div>
    {query.isLoading && <div role="status" className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />}
    {query.isError && <div role="alert" className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)' }}>Could not load your listings.</div>}
    {!query.isLoading && !query.isError && <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}><div className="table-container"><table className="data-table"><thead><tr><th>Vehicle</th><th>Year</th><th>Price</th><th>Mileage</th><th>Status</th><th>Actions</th></tr></thead><tbody>{listings.map((listing) => { const isPending = pendingActionId === listing.id; return <tr key={listing.id}><td><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>{listing.images[0]?.url && <img src={listing.images[0].url} alt="" style={{ width: TABLE_THUMB_WIDTH, height: TABLE_THUMB_HEIGHT, borderRadius: 4, objectFit: 'cover' }} />}<strong>{listing.title}</strong></div></td><td>{listing.year}</td><td>{formatPrice(listing.price, listing.currency)}</td><td>{formatMileage(getMileageKm(listing) ?? 0)}</td><td><ListingStatusBadge status={listing.status} /></td><td><div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><Link to={`/dealer/listings/${listing.id}/edit`} className="btn btn-ghost btn-sm" aria-disabled={Boolean(pendingActionId)}>Edit</Link>{listing.status === 'active' && <Link to={`/marketplace/${listing.id}`} className="btn btn-ghost btn-sm" aria-disabled={Boolean(pendingActionId)}>Preview</Link>}{listing.status === 'draft' && <button className="btn btn-success btn-sm" disabled={Boolean(pendingActionId)} onClick={() => void changeStatus(listing.id, 'active')}>{isPending ? 'Publishing…' : 'Publish'}</button>}{listing.status === 'active' && <button className="btn btn-secondary btn-sm" disabled={Boolean(pendingActionId)} onClick={() => void changeStatus(listing.id, 'sold')}>{isPending ? 'Updating…' : 'Mark sold'}</button>}{listing.status !== 'archived' && <button className="btn btn-danger btn-sm" disabled={Boolean(pendingActionId)} onClick={() => void changeStatus(listing.id, 'archived')}>{isPending ? 'Archiving…' : 'Archive'}</button>}{listing.status === 'archived' && <button className="btn btn-danger btn-sm" disabled={Boolean(pendingActionId)} onClick={() => void deleteVehicle(listing.id, listing.title)}>{isPending ? 'Deleting…' : 'Delete'}</button>}</div></td></tr>; })}</tbody></table>{listings.length === 0 && <div className="empty-state"><p>{view === 'archived' ? 'No archived listings.' : 'No listings found.'}</p></div>}<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}><button className="btn btn-secondary btn-sm" disabled={page <= 1 || Boolean(pendingActionId)} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="btn btn-secondary btn-sm" disabled={page >= totalPages || Boolean(pendingActionId)} onClick={() => setPage((current) => current + 1)}>Next</button></div></div></div>}
  </div>;
};
