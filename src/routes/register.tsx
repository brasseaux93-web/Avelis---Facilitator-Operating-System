import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import './auth.css';
import { useFacilitatorAuth } from '../lib/FacilitatorAuthContext';
import { ProtocolMark } from '../components/Logo';
import { apiGet, apiPost } from '../lib/apiClient';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const { setSession } = useFacilitatorAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void apiGet<{ publicRegister: boolean }>('/api/auth/register-status', { auth: false })
      .then((r) => setAllowed(r.publicRegister))
      .catch(() => setAllowed(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email || !email.includes('@')) {
      setEmailError('Enter a valid work email.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (!displayName || !organizationName) {
      setFormError('Name and organization are required.');
      return;
    }

    setEmailError('');
    setIsLoading(true);

    try {
      const { token, facilitator } = await apiPost<{
        token: string;
        facilitator: { id: string; email: string; displayName: string; organizationId: string };
      }>(
        '/api/auth/register',
        { email, password, displayName, organizationName },
        { auth: false }
      );

      setSession(token, facilitator);
      navigate({ to: '/sessions' });
    } catch {
      setFormError('Could not complete registration. Please try again.');
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
            <h2 className="auth-title">Facilitator organization</h2>
            <p className="auth-subtitle">
              This creates an operator account. Participants never register.
            </p>
          </div>

          {allowed === false && (
            <div className="auth-trust-note">
              Self-serve registration is closed on this host. Request institutional evaluation, then
              sign in with a provisioned work account.
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Link to="/evaluation" className="auth-link">
                  Request evaluation
                </Link>
                {' · '}
                <Link to="/auth" className="auth-link">
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {allowed && (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {formError && (
                <span className="auth-error" role="alert">
                  {formError}
                </span>
              )}

              <div className="auth-field">
                <label htmlFor="displayName" className="auth-label">
                  Your name
                </label>
                <input
                  id="displayName"
                  type="text"
                  className="auth-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="organizationName" className="auth-label">
                  Organization
                </label>
                <input
                  id="organizationName"
                  type="text"
                  className="auth-input"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  autoComplete="organization"
                  required
                  disabled={isLoading}
                />
              </div>

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
                <label htmlFor="password" className="auth-label">
                  Password (8+ characters)
                </label>
                <input
                  id="password"
                  type="password"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                />
              </div>

              <button type="submit" className="auth-btn auth-btn--primary" disabled={isLoading}>
                {isLoading && <span className="auth-spinner" aria-hidden="true"></span>}
                {isLoading ? 'Creating organization…' : 'Create facilitator account'}
              </button>
            </form>
          )}

          {allowed && (
            <div className="auth-trust-note" style={{ marginTop: 'var(--space-4)' }}>
              Already provisioned? <Link to="/auth" className="auth-link">Sign in</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
