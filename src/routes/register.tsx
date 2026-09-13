import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import './auth.css';
import { useFacilitatorAuth } from '../lib/FacilitatorAuthContext';
import { ProtocolMark } from '../components/Logo';
import { apiPost } from '../lib/apiClient';

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
  const { setSession } = useFacilitatorAuth();
  const navigate = useNavigate();

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
      setFormError('Name and Organization are required.');
      return;
    }
    
    setEmailError('');
    setIsLoading(true);

    try {
      const data = await apiPost<{
        token: string;
        facilitator: { id: string; email: string; displayName: string; organizationId: string };
      }>('/api/auth/register', { email, password, displayName, organizationName }, { auth: false });

      setSession(data.token, data.facilitator);
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
            <h2 className="auth-title">Create an Account</h2>
            <p className="auth-subtitle">Register your organization to facilitate secure sessions.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {formError && (
              <span className="auth-error" role="alert">
                {formError}
              </span>
            )}
            
            <div className="auth-field">
              <label htmlFor="displayName" className="auth-label">
                Full Name
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
                Organization Name
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
                Work Email
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
                  Password (8+ characters)
                </label>
              </div>
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
              {isLoading ? 'Registering…' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider">or</div>

          <div className="auth-trust-note" style={{ marginTop: 'var(--space-4)' }}>
            Already have an account? <Link to="/auth" className="auth-link">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
