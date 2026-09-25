import React, { useEffect, useState } from 'react';
import { getMyDealerApplication, updateMyDealerProfile } from '@/features/dealers/services/dealerApi';
import type { DealerApplication } from '@/features/dealers/types/dealer.types';

type ProfileForm = {
  representativeName: string; phone: string; address: string; city: string; province: string;
  businessPhone: string; businessEmail: string; website: string; dealershipType: 'new' | 'used' | 'both';
  brands: string; description: string; inventoryCount: string;
};

const toForm = (dealer: DealerApplication): ProfileForm => ({
  representativeName: dealer.representativeName, phone: dealer.phone, address: dealer.address, city: dealer.city, province: dealer.province,
  businessPhone: dealer.businessPhone, businessEmail: dealer.businessEmail, website: dealer.website ?? '', dealershipType: dealer.dealershipType,
  brands: dealer.brands.join(', '), description: dealer.description, inventoryCount: dealer.inventoryCount === null ? '' : String(dealer.inventoryCount),
});

// Lets an approved dealer keep the business details buyers see up to date (FR-DEALER-03).
// The business name and registration number were verified during review, so they are read-only.
export const DealerProfile: React.FC = () => {
  const [dealer, setDealer] = useState<DealerApplication | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyDealerApplication()
      .then((loaded) => { setDealer(loaded); setForm(toForm(loaded)); })
      .catch(() => setStatus({ kind: 'error', message: 'Your business profile could not be loaded. Please refresh the page.' }));
  }, []);

  if (!form || !dealer) return status ? <div className="alert alert-error" role="alert">{status.message}</div> : <div role="status" aria-label="Loading profile" className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />;

  const set = (field: keyof ProfileForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [field]: event.target.value });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setStatus(null);
    try {
      const updated = await updateMyDealerProfile({
        representativeName: form.representativeName, phone: form.phone, address: form.address, city: form.city, province: form.province,
        businessPhone: form.businessPhone, businessEmail: form.businessEmail, website: form.website.trim(), dealershipType: form.dealershipType,
        brands: form.brands.split(',').map((brand) => brand.trim()).filter(Boolean), description: form.description,
        ...(form.inventoryCount.trim() ? { inventoryCount: Number(form.inventoryCount) } : {}),
      });
      setDealer(updated); setForm(toForm(updated));
      setStatus({ kind: 'success', message: 'Your business profile was saved. Buyers now see the updated details.' });
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Your changes could not be saved.' });
    } finally { setSaving(false); }
  };

  const field = (label: string, name: keyof ProfileForm, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="form-group"><span className="form-label">{label}</span><input className="form-input" name={name} value={form[name]} onChange={set(name)} {...props} /></label>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header"><div><h1 className="page-title">Business Profile</h1><p className="page-subtitle">The contact and business details buyers see on your listings.</p></div></div>
      {status && <div className={`alert ${status.kind === 'error' ? 'alert-error' : 'alert-success'}`} role={status.kind === 'error' ? 'alert' : 'status'} style={{ marginBottom: '1rem' }}>{status.message}</div>}
      <form onSubmit={(event) => void save(event)} className="glass-card auth-form-grid" style={{ padding: '1.5rem' }}>
        <div className="form-group"><span className="form-label">Business name</span><strong>{dealer.businessName}</strong></div>
        <div className="form-group"><span className="form-label">Registration number</span><strong>{dealer.registrationNumber}</strong></div>
        <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>These two were verified during your application review. Contact MotorX support to change them.</p>
        {field('Representative name', 'representativeName', { required: true, minLength: 2 })}
        {field('Phone', 'phone', { required: true, minLength: 7, type: 'tel' })}
        {field('Business phone', 'businessPhone', { required: true, minLength: 7, type: 'tel' })}
        {field('Business email', 'businessEmail', { required: true, type: 'email' })}
        <label className="form-group" style={{ gridColumn: '1 / -1' }}><span className="form-label">Business address</span><textarea className="form-textarea" name="address" rows={2} value={form.address} onChange={set('address')} required minLength={5} /></label>
        {field('City / District', 'city', { required: true, minLength: 2 })}
        {field('Province', 'province', { required: true, minLength: 2 })}
        {field('Website or social page (optional)', 'website', { type: 'url', placeholder: 'https://' })}
        <label className="form-group"><span className="form-label">Type of dealership</span><select className="form-select" name="dealershipType" value={form.dealershipType} onChange={set('dealershipType')}><option value="new">New vehicles</option><option value="used">Used vehicles</option><option value="both">Both</option></select></label>
        {field('Main brands (comma separated)', 'brands')}
        {field('Vehicles normally available (optional)', 'inventoryCount', { type: 'number', min: 0 })}
        <label className="form-group" style={{ gridColumn: '1 / -1' }}><span className="form-label">Business description</span><textarea className="form-textarea" name="description" rows={4} value={form.description} onChange={set('description')} required minLength={20} /></label>
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button></div>
      </form>
    </div>
  );
};
