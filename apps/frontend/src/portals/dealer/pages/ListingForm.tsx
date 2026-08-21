import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  carBodyTypes, fuelTypes, motorcycleTypes, transmissionTypes, vehicleCategories, vehicleConditions,
  type CreateListingInput, type VehicleCategory,
} from '@motorx/shared-contracts';
import { listingApi } from '@/features/listings/services/listingApi';
import { formatEnumLabel } from '@/features/listings/utils/vehicleAttributes';
import { availableMakes } from '@/shared/constants/vehicle';
import { ImageCropModal } from '@/features/listings/components/ImageCropModal';

const categoryLabels: Record<VehicleCategory, string> = { car: 'Car', motorcycle: 'Motorcycle', van: 'Van', truck: 'Truck', three_wheeler: 'Three-Wheeler', bus: 'Bus', other: 'Other' };
const listableCategories = vehicleCategories.filter((category) => category !== 'other');

// Combustion-bearing fuel types need an engine capacity; battery-bearing ones need battery specs.
// (Matches the conditional rules enforced server-side by the shared Zod attribute schemas.)
const engineRequiredFuels = new Set(['petrol', 'diesel', 'hybrid', 'plug_in_hybrid']);
const batteryRequiredFuels = new Set(['electric', 'plug_in_hybrid']);
const listableFuelTypes = fuelTypes.filter((fuel) => fuel !== 'other');
const listableTransmissions = transmissionTypes.filter((transmission) => transmission !== 'other');

interface CommonFormState { registrationNumber: string; title: string; make: string; model: string; year: number; price: number; currency: string; location: string; description: string; status: 'draft' | 'active' }
interface AttributesFormState { edition: string; bodyType: string; bikeType: string; condition: string; mileageKm: string; fuelType: string; transmission: string; engineCapacityCc: string; batteryCapacityKWh: string; batteryRangeKm: string; seatingCapacity: string; payloadCapacityKg: string }

export const ListingForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [croppedSoFar, setCroppedSoFar] = useState<File[]>([]);
  const [category, setCategory] = useState<VehicleCategory>('car');
  const [common, setCommon] = useState<CommonFormState>({
    registrationNumber: '', title: '', make: availableMakes[0], model: '', year: new Date().getFullYear(),
    price: 0, currency: 'LKR', location: '', description: '', status: 'draft',
  });
  const [attrs, setAttrs] = useState<AttributesFormState>({
    edition: '', bodyType: 'sedan', bikeType: 'standard', condition: 'used', mileageKm: '',
    fuelType: 'petrol', transmission: 'automatic', engineCapacityCc: '', batteryCapacityKWh: '', batteryRangeKm: '',
    seatingCapacity: '', payloadCapacityKg: '',
  });

  const showEdition = category !== 'three_wheeler' && category !== 'bus';
  const showEngine = engineRequiredFuels.has(attrs.fuelType);
  const showBattery = batteryRequiredFuels.has(attrs.fuelType);

  function buildAttributes(): Record<string, unknown> {
    const base: Record<string, unknown> = {
      fuelType: attrs.fuelType, transmission: attrs.transmission, condition: attrs.condition, mileageKm: Number(attrs.mileageKm),
      ...(showEdition && attrs.edition ? { edition: attrs.edition } : {}),
      ...(showEngine && attrs.engineCapacityCc ? { engineCapacityCc: Number(attrs.engineCapacityCc) } : {}),
      ...(showBattery && attrs.batteryCapacityKWh ? { batteryCapacityKWh: Number(attrs.batteryCapacityKWh) } : {}),
      ...(showBattery && attrs.batteryRangeKm ? { batteryRangeKm: Number(attrs.batteryRangeKm) } : {}),
    };
    switch (category) {
      case 'car': return { ...base, bodyType: attrs.bodyType };
      case 'motorcycle': return { ...base, bikeType: attrs.bikeType };
      case 'van': return { ...base, ...(attrs.seatingCapacity ? { seatingCapacity: Number(attrs.seatingCapacity) } : {}) };
      case 'truck': return { ...base, ...(attrs.payloadCapacityKg ? { payloadCapacityKg: Number(attrs.payloadCapacityKg) } : {}) };
      case 'bus': return { ...base, ...(attrs.seatingCapacity ? { seatingCapacity: Number(attrs.seatingCapacity) } : {}) };
      default: return base; // three_wheeler has no category-specific extras
    }
  }

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    setCropQueue(files);
    setCroppedSoFar([]);
  };

  const handleCropConfirm = (croppedFile: File) => {
    const done = [...croppedSoFar, croppedFile];
    const remaining = cropQueue.slice(1);
    if (remaining.length === 0) {
      setImages(done);
      setCropQueue([]);
      setCroppedSoFar([]);
    } else {
      setCroppedSoFar(done);
      setCropQueue(remaining);
    }
  };

  const handleCropSkip = () => {
    const remaining = cropQueue.slice(1);
    if (remaining.length === 0) {
      if (croppedSoFar.length > 0) setImages(croppedSoFar);
      setCropQueue([]);
      setCroppedSoFar([]);
    } else {
      setCropQueue(remaining);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = { ...common, category, attributes: buildAttributes() } as CreateListingInput;
      const listing = await listingApi.createListing(payload);
      for (const image of images) await listingApi.uploadImage(listing.id, image, common.title);
      navigate('/dealer/listings');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create the listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header"><div><h1 className="page-title">Add New Vehicle Listing</h1><p className="page-subtitle">Select a vehicle category, then fill in its details. Fields adjust to match what that category and fuel type need.</p></div></div>
      {error && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <label className="form-group">
          <span className="form-label">Vehicle Category *</span>
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value as VehicleCategory)}>
            {listableCategories.map((value) => <option key={value} value={value}>{categoryLabels[value]}</option>)}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="form-group"><span className="form-label">Registration Number *</span><input className="form-input" value={common.registrationNumber} onChange={(e) => setCommon({ ...common, registrationNumber: e.target.value })} placeholder="CAX-1234" required /></label>
          <label className="form-group"><span className="form-label">Make *</span><select className="form-select" value={common.make} onChange={(e) => setCommon({ ...common, make: e.target.value })}>{availableMakes.map((make) => <option key={make}>{make}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Model *</span><input className="form-input" value={common.model} onChange={(e) => setCommon({ ...common, model: e.target.value })} required /></label>
          {showEdition && <label className="form-group"><span className="form-label">Edition</span><input className="form-input" value={attrs.edition} onChange={(e) => setAttrs({ ...attrs, edition: e.target.value })} placeholder="G" /></label>}

          {category === 'car' && <label className="form-group"><span className="form-label">Body Type *</span><select className="form-select" value={attrs.bodyType} onChange={(e) => setAttrs({ ...attrs, bodyType: e.target.value })}>{carBodyTypes.map((value) => <option key={value} value={value}>{formatEnumLabel(value)}</option>)}</select></label>}
          {category === 'motorcycle' && <label className="form-group"><span className="form-label">Bike Type *</span><select className="form-select" value={attrs.bikeType} onChange={(e) => setAttrs({ ...attrs, bikeType: e.target.value })}>{motorcycleTypes.map((value) => <option key={value} value={value}>{formatEnumLabel(value)}</option>)}</select></label>}

          <label className="form-group"><span className="form-label">Year of Manufacture *</span><input type="number" className="form-input" value={common.year} onChange={(e) => setCommon({ ...common, year: Number(e.target.value) })} min="1900" required /></label>
          <label className="form-group"><span className="form-label">Condition *</span><select className="form-select" value={attrs.condition} onChange={(e) => setAttrs({ ...attrs, condition: e.target.value })}>{vehicleConditions.map((value) => <option key={value} value={value}>{formatEnumLabel(value)}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Mileage (km) *</span><input type="number" className="form-input" value={attrs.mileageKm} onChange={(e) => setAttrs({ ...attrs, mileageKm: e.target.value })} min="0" required /></label>
          <label className="form-group"><span className="form-label">Fuel Type *</span><select className="form-select" value={attrs.fuelType} onChange={(e) => setAttrs({ ...attrs, fuelType: e.target.value })}>{listableFuelTypes.map((value) => <option key={value} value={value}>{formatEnumLabel(value)}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Transmission *</span><select className="form-select" value={attrs.transmission} onChange={(e) => setAttrs({ ...attrs, transmission: e.target.value })}>{listableTransmissions.map((value) => <option key={value} value={value}>{formatEnumLabel(value)}</option>)}</select></label>

          {showEngine && <label className="form-group"><span className="form-label">Engine Capacity (cc) *</span><input type="number" className="form-input" value={attrs.engineCapacityCc} onChange={(e) => setAttrs({ ...attrs, engineCapacityCc: e.target.value })} min="0" required /></label>}
          {showBattery && (
            <>
              <label className="form-group"><span className="form-label">Battery Capacity (kWh) *</span><input type="number" className="form-input" value={attrs.batteryCapacityKWh} onChange={(e) => setAttrs({ ...attrs, batteryCapacityKWh: e.target.value })} min="0" required /></label>
              <label className="form-group"><span className="form-label">Battery Range (km) *</span><input type="number" className="form-input" value={attrs.batteryRangeKm} onChange={(e) => setAttrs({ ...attrs, batteryRangeKm: e.target.value })} min="0" required /></label>
            </>
          )}

          {(category === 'van' || category === 'bus') && <label className="form-group"><span className="form-label">Seating Capacity</span><input type="number" className="form-input" value={attrs.seatingCapacity} onChange={(e) => setAttrs({ ...attrs, seatingCapacity: e.target.value })} min="0" /></label>}
          {category === 'truck' && <label className="form-group"><span className="form-label">Payload Capacity (kg)</span><input type="number" className="form-input" value={attrs.payloadCapacityKg} onChange={(e) => setAttrs({ ...attrs, payloadCapacityKg: e.target.value })} min="0" /></label>}

          <label className="form-group"><span className="form-label">Location *</span><input className="form-input" value={common.location} onChange={(e) => setCommon({ ...common, location: e.target.value })} placeholder="Colombo" required /></label>
          <label className="form-group"><span className="form-label">Price *</span><input type="number" className="form-input" value={common.price} onChange={(e) => setCommon({ ...common, price: Number(e.target.value) })} min="0" required /></label>
          <label className="form-group"><span className="form-label">Currency *</span><input className="form-input" value={common.currency} onChange={(e) => setCommon({ ...common, currency: e.target.value.toUpperCase() })} maxLength={3} required /></label>
          <label className="form-group"><span className="form-label">Initial Status *</span><select className="form-select" value={common.status} onChange={(e) => setCommon({ ...common, status: e.target.value as 'draft' | 'active' })}><option value="draft">Draft</option><option value="active">Active</option></select></label>
        </div>
        <label className="form-group"><span className="form-label">Listing Title *</span><input className="form-input" value={common.title} onChange={(e) => setCommon({ ...common, title: e.target.value })} minLength={3} required /></label>
        <label className="form-group"><span className="form-label">Description</span><textarea className="form-textarea" rows={4} value={common.description} onChange={(e) => setCommon({ ...common, description: e.target.value })} /></label>
        <label className="form-group">
          <span className="form-label">Vehicle Images</span>
          <input type="file" className="form-input" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { handleFilesSelected(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            For best results, use images at least 640×384 px in a 5:3 aspect ratio. Other image sizes are accepted and can be cropped before upload.
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            {cropQueue.length > 0 ? `Cropping ${croppedSoFar.length + 1} of ${croppedSoFar.length + cropQueue.length}…` : `${images.length} image(s) selected`}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}><button type="button" onClick={() => navigate('/dealer/listings')} className="btn btn-secondary">Cancel</button><button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg">{isSubmitting ? 'Creating…' : 'Create Listing'}</button></div>
      </form>
      {cropQueue.length > 0 && <ImageCropModal file={cropQueue[0]} onConfirm={handleCropConfirm} onCancel={handleCropSkip} />}
    </div>
  );
};
