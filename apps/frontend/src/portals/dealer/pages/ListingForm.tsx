import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fuelTypes, transmissionTypes, type CreateListingInput } from '@motorx/shared-contracts';
import { listingApi } from '@/features/listings/services/listingApi';
import { availableMakes } from '@/shared/mockData';

export const ListingForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState<CreateListingInput>({
    make: 'Toyota', model: '', year: new Date().getFullYear(), price: 0,
    currency: 'LKR', mileageKm: 0, fuelType: 'petrol', transmission: 'automatic',
    location: '', title: '', description: '', status: 'draft',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const listing = await listingApi.createListing(formData);
      for (const image of images) await listingApi.uploadImage(listing.id, image, formData.title);
      navigate('/dealer/listings');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create the listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header"><div><h1 className="page-title">Add New Vehicle Listing</h1><p className="page-subtitle">Create the listing first, then selected images are uploaded to secure object storage.</p></div></div>
      {error && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="form-group"><span className="form-label">Make *</span><select className="form-select" value={formData.make} onChange={(e) => setFormData({ ...formData, make: e.target.value })}>{availableMakes.map((make) => <option key={make}>{make}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Model *</span><input className="form-input" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} required /></label>
          <label className="form-group"><span className="form-label">Year *</span><input type="number" className="form-input" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} min="1900" required /></label>
          <label className="form-group"><span className="form-label">Location *</span><input className="form-input" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Colombo" required /></label>
          <label className="form-group"><span className="form-label">Price *</span><input type="number" className="form-input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} min="0" required /></label>
          <label className="form-group"><span className="form-label">Currency *</span><input className="form-input" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })} maxLength={3} required /></label>
          <label className="form-group"><span className="form-label">Mileage (km) *</span><input type="number" className="form-input" value={formData.mileageKm} onChange={(e) => setFormData({ ...formData, mileageKm: Number(e.target.value) })} min="0" required /></label>
          <label className="form-group"><span className="form-label">Fuel Type *</span><select className="form-select" value={formData.fuelType} onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as CreateListingInput['fuelType'] })}>{fuelTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Transmission *</span><select className="form-select" value={formData.transmission} onChange={(e) => setFormData({ ...formData, transmission: e.target.value as CreateListingInput['transmission'] })}>{transmissionTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Initial Status *</span><select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' })}><option value="draft">Draft</option><option value="active">Active</option></select></label>
        </div>
        <label className="form-group"><span className="form-label">Listing Title *</span><input className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} minLength={3} required /></label>
        <label className="form-group"><span className="form-label">Description</span><textarea className="form-textarea" rows={4} value={formData.description ?? ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></label>
        <label className="form-group"><span className="form-label">Vehicle Images</span><input type="file" className="form-input" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setImages(Array.from(e.target.files ?? []))} /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{images.length} image(s) selected</span></label>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}><button type="button" onClick={() => navigate('/dealer/listings')} className="btn btn-secondary">Cancel</button><button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg">{isSubmitting ? 'Creating…' : 'Create Listing'}</button></div>
      </form>
    </div>
  );
};
