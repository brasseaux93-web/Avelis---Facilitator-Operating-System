import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import './auth.css';
import { useFacilitatorAuth } from '../lib/FacilitatorAuthContext';
import { ProtocolMark } from '../components/Logo';
import { apiPost } from '../lib/apiClient';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const { setSession } = useFacilitatorAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email || !email.includes('@')) {
      setEmailError('Enter a valid work email.');
      return;
    }
    setEmailError('');
    setIsLoading(true);

    try {
      const { token, supabaseToken, facilitator } = await apiPost<{
        token: string;
        supabaseToken: string;
        facilitator: { id: string; email: string; displayName: string; organizationId: string };
      }>('/api/auth/login', { email, password }, { auth: false });

      setSession(token, supabaseToken, facilitator);
      navigate({ to: '/sessions' });
    } catch {
      setFormError('Sign in did not complete.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-ambient-glow" aria-hidden="true"></div>

      <div className="auth-panel-form">
        <div className="auth-form-container">
          <div className="auth-header">
            <div className="auth-brand-logo" aria-hidden="true">
              <ProtocolMark accent="currentColor" />
            </div>
            <h2 className="auth-title">Facilitator sign in</h2>
            <p className="auth-subtitle">Sign in with your authorized work account.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {formError && (
              <span className="auth-error" role="alert">
                {formError}
              </span>
            )}
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                Work email
              </label>
              <input
                id="email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                disabled={isLoading}
              />
              {emailError && (
                <span id="email-error" className="auth-error" aria-live="polite">
                  {emailError}
                </span>
              )}
            </div>

            <div className="auth-field">
              <div className="auth-actions">
                <label htmlFor="password" className="auth-label">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="auth-btn auth-btn--primary" disabled={isLoading}>
              {isLoading && <span className="auth-spinner" aria-hidden="true"></span>}
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-divider">or</div>

          <button type="button" className="auth-btn auth-btn--sso" disabled title="Not available in MVP">
            Not available in MVP
          </button>

          <div className="auth-trust-note">
            <span>
              Facilitator access uses organization-scoped accounts. Tokens stay in memory only.
              Room messages are not stored by Avelis.
            </span>
            <div style={{ marginTop: 'var(--space-4)' }}>
              Need an institutional account? <Link to="/register" className="auth-link">Sign up here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
