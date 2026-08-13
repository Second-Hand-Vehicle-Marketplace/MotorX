import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
  const { registerDealerApplication } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    applicantName: '',
    email: '',
    password: '',
    businessName: '',
    businessLicense: '',
    phone: '',
    address: '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const application = await registerDealerApplication(formData);
      navigate('/dealer/pending', {
        state: {
          email: application.email,
          businessName: application.businessName,
        },
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Could not submit dealer application.';
      setError(message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 760, padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="page-title">Dealer Registration</h1>
          <p className="page-subtitle">Submit your dealership details. An administrator must approve your application before sign-in is enabled.</p>
        </div>

        {error && (
          <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderColor: 'var(--color-error)' }}>
            <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Applicant Name</label>
            <input className="form-input" value={formData.applicantName} onChange={(e) => handleChange('applicantName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input className="form-input" value={formData.businessName} onChange={(e) => handleChange('businessName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Business License</label>
            <input className="form-input" value={formData.businessLicense} onChange={(e) => handleChange('businessLicense', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} required />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Business Address</label>
            <textarea className="form-textarea" rows={3} value={formData.address} onChange={(e) => handleChange('address', e.target.value)} required />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Link to="/login" className="btn btn-secondary">Back to Login</Link>
            <button type="submit" className="btn btn-primary">Submit Dealer Application</button>
          </div>
        </form>
      </div>
    </div>
  );
};