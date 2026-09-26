import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { firebaseAuth } from '../services/firebaseAuth';
import { useI18n } from '../../../shared/i18n/useI18n';
import { LanguageSwitcher } from '../../../shared/i18n/LanguageSwitcher';
import type { I18nContextValue } from '../../../shared/i18n/I18nProvider';

function friendlyMessage(error: unknown, t: I18nContextValue['t']): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('invalid-credential')) return t('auth.wrongPassword');
  if (code.includes('too-many-requests')) return t('auth.tooMany');
  return error instanceof Error ? error.message : t('auth.unavailable');
}

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
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
      setMessage({ kind: 'error', text: friendlyMessage(error, t) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setMessage({ kind: 'error', text: t('auth.emailFirst') });
      return;
    }
    try {
      await firebaseAuth.sendPasswordReset(email.trim());
      setMessage({ kind: 'success', text: t('auth.resetSent') });
    } catch (error) {
      setMessage({ kind: 'error', text: friendlyMessage(error, t) });
    }
  };

  return (
    <div className="glass-card auth-card">
      <div className="auth-heading">
        <span className="auth-eyebrow">{t('auth.eyebrow')}</span>
        <h1>{t('auth.welcome')}</h1>
        <p>{t('auth.intro')}</p>
      </div>

      {message && <div className={`auth-message auth-message-${message.kind}`} role="alert">{message.text}</div>}

      <form onSubmit={handleSignIn} className="auth-form">
        <label className="form-group">
          <span className="form-label">{t('auth.email')}</span>
          <input type="email" inputMode="email" className="form-input" autoComplete="email" placeholder="name@example.com"
            value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} required />
        </label>

        <label className="form-group">
          <span className="form-label">{t('auth.password')}</span>
          <span className="password-field">
            <input type={showPassword ? 'text' : 'password'} className="form-input" autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')} value={password} onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? t('auth.hide') : t('auth.show')}
            </button>
          </span>
        </label>

        <button type="button" className="auth-text-button" onClick={handlePasswordReset} disabled={isSubmitting}>
          {t('auth.forgot')}
        </button>

        <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <p className="auth-switch">{t('auth.noAccount')} <Link to="/signup">{t('auth.signUp')}</Link></p>
      <div className="auth-footer-links"><Link to="/">{t('nav.home')}</Link><span aria-hidden="true">&bull;</span><Link to="/marketplace">{t('auth.browse')}</Link></div>
      <LanguageSwitcher className="auth-language" />
    </div>
  );
};
