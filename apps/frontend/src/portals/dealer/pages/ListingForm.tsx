import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingApi } from '@/features/listings/services/listingApi';
import { availableMakes, bodyTypes, fuelTypes, transmissionTypes } from '@/shared/mockData';

export const ListingForm: React.FC = () => {
  const navigate = useNavigate();
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await listingApi.createListing(formData as any);
    navigate('/dealer/listings');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Vehicle Listing</h1>
          <p className="page-subtitle">Fill in the details below to add a vehicle to the marketplace</p>
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

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" onClick={() => navigate('/dealer/listings')} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg">
            Create Listing
          </button>
        </div>
      </form>
    </div>
  );
};