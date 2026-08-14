import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listingApi } from '@/features/listings/services/listingApi';
import { availableMakes, bodyTypes, fuelTypes, transmissionTypes } from '@/features/listings/constants/filterOptions';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const ListingForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [formData, setFormData] = useState({
    make: 'BMW',
    model: '',
    year: 2024,
    price: 35000,
    mileage: 12000,
    bodyType: 'sedan',
    fuelType: 'petrol',
    transmission: 'automatic',
    condition: 'excellent',
    color: 'Black',
    title: '',
    description: '',
    vin: '',
    plateNumber: '',
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  React.useEffect(() => {
    if (!editId) return;
    void listingApi.getListingById(editId).then((listing) => {
      if (!listing) return;
      setFormData({
        make: listing.make,
        model: listing.model,
        year: listing.year,
        price: listing.price,
        mileage: listing.mileage,
        bodyType: listing.bodyType,
        fuelType: listing.fuelType,
        transmission: listing.transmission,
        condition: listing.condition,
        color: listing.color,
        title: listing.title,
        description: listing.description,
        vin: listing.vin ?? '',
        plateNumber: listing.plateNumber ?? '',
      });
    });
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vin.trim() || !formData.plateNumber.trim()) {
      window.alert('Provide both a VIN and plate number before saving the listing.');
      return;
    }
    if (editId) await listingApi.updateListing(editId, formData as any);
    else await listingApi.createListing({ ...formData, dealerId: user?.id, dealerName: user?.businessName || user?.displayName } as any, selectedImages);
    navigate('/dealer/listings');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{editId ? 'Edit Vehicle Listing' : 'Add New Vehicle Listing'}</h1>
          <p className="page-subtitle">{editId ? 'Update the details for this vehicle listing' : 'Fill in the details below to add a vehicle to the marketplace'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.75rem' }}>
          Basic Information
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Make *</label>
            <select
              className="form-select"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              required
            >
              {availableMakes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Model *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 3 Series, Camry"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Year *</label>
            <input
              type="number"
              className="form-input"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alpine White"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">VIN *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Vehicle identification number"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Plate Number *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Registration plate number"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
            />
            <small style={{ color: 'var(--color-text-tertiary)' }}>Both identifiers are required.</small>
          </div>
        </div>

        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.75rem', marginTop: '1rem' }}>
          Pricing & Condition
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Price ($) *</label>
            <input
              type="number"
              className="form-input"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mileage (mi) *</label>
            <input
              type="number"
              className="form-input"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Condition *</label>
            <select
              className="form-select"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Body Type</label>
            <select
              className="form-select"
              value={formData.bodyType}
              onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
            >
              {bodyTypes.map(bt => <option key={bt} value={bt} style={{ textTransform: 'capitalize' }}>{bt}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fuel Type</label>
            <select
              className="form-select"
              value={formData.fuelType}
              onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
            >
              {fuelTypes.map(ft => <option key={ft} value={ft} style={{ textTransform: 'capitalize' }}>{ft}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Transmission</label>
            <select
              className="form-select"
              value={formData.transmission}
              onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
            >
              {transmissionTypes.map(tt => <option key={tt} value={tt} style={{ textTransform: 'capitalize' }}>{tt}</option>)}
            </select>
          </div>
        </div>

        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '0.75rem', marginTop: '1rem' }}>
          Listing Content
        </h3>

        <div className="form-group">
          <label className="form-label">Listing Title *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 2024 BMW 330i xDrive — M Sport Package"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Provide details about condition, package features, service history..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        {!editId && (
          <div className="form-group">
            <label className="form-label">Vehicle Images</label>
            <input
              type="file"
              className="form-input"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              onChange={(event) => {
                const newlySelected = Array.from(event.target.files ?? []);
                setSelectedImages((current) => {
                  const files = [...current, ...newlySelected];
                  return files.filter((file, index, all) => all.findIndex((item) => item.name === file.name && item.size === file.size) === index);
                });
                event.target.value = '';
              }}
            />
            <small style={{ color: 'var(--color-text-tertiary)' }}>
              Select multiple photos with Ctrl/Shift, or choose more photos in several rounds. The first image becomes the primary image.
              {selectedImages.length ? ` ${selectedImages.length} image${selectedImages.length === 1 ? '' : 's'} selected.` : ''}
            </small>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" onClick={() => navigate('/dealer/listings')} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg">
            {editId ? 'Save Changes' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};