import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { firebaseAuth } from '../services/firebaseAuth';

function friendlyMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('invalid-credential')) return 'The email address or password is incorrect.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait before trying again.';
  return error instanceof Error ? error.message : 'Unable to sign in right now.';
}

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (user.dealerStatus === 'pending' || user.dealerStatus === 'rejected') {
        navigate('/dealer/application-status');
      } else if (user.role === 'dealer') {
        navigate('/dealer');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/marketplace');
      }
    } catch (error) {
      setMessage({ kind: 'error', text: friendlyMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setMessage({ kind: 'error', text: 'Enter your email address before requesting a password reset.' });
      return;
    }
    try {
      await firebaseAuth.sendPasswordReset(email.trim());
      setMessage({ kind: 'success', text: 'Password reset instructions have been sent to your email.' });
    } catch (error) {
      setMessage({ kind: 'error', text: friendlyMessage(error) });
    }
  };

  return (
    <div className="glass-card auth-card">
      <div className="auth-heading">
        <span className="auth-eyebrow">Secure account access</span>
        <h1>Welcome back</h1>
        <p>Sign in to browse saved vehicles or manage your MotorX workspace.</p>
      </div>

      {message && <div className={`auth-message auth-message-${message.kind}`} role="alert">{message.text}</div>}

      <form onSubmit={handleSignIn} className="auth-form">
        <label className="form-group">
          <span className="form-label">Email address</span>
          <input type="email" className="form-input" autoComplete="email" placeholder="name@example.com"
            value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} required />
        </label>

        <label className="form-group">
          <span className="form-label">Password</span>
          <span className="password-field">
            <input type={showPassword ? 'text' : 'password'} className="form-input" autoComplete="current-password"
              placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>

        <button type="button" className="auth-text-button" onClick={handlePasswordReset} disabled={isSubmitting}>
          Forgot password?
        </button>

        <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="auth-switch">Don't have an account? <Link to="/signup">Sign Up</Link></p>
      <div className="auth-footer-links"><Link to="/">Home</Link><span aria-hidden="true">&bull;</span><Link to="/marketplace">Browse vehicles</Link></div>
    </div>
  );
};
