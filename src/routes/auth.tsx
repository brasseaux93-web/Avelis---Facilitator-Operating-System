import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';
import './auth.css';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !email.includes('@')) {
      setEmailError('Enter a valid work email.');
      return;
    }
    setEmailError('');
    
    setIsLoading(true);
    
    // Simulate API integration and loading state
    setTimeout(() => {
      setIsLoading(false);
      // Mock successful login redirection or state update
      console.log('Logged in with', email);
    }, 1200);
  };

  const handleSso = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log('SSO login triggered');
    }, 1200);
  };

  return (
    <div className="auth-layout">
      <div className="auth-ambient-glow" aria-hidden="true"></div>
      
      <div className="auth-panel-form">
        <div className="auth-form-container">
          <div className="auth-header">
            <div className="auth-brand-logo" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 28L16 4L25 28" />
                <path d="M11.5 19L20.5 19" />
                <path d="M13 19V14L16 11L19 14V19" />
              </svg>
            </div>
            <h2 className="auth-title">Secure access</h2>
            <p className="auth-subtitle">Sign in with your authorized work account.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Work email</label>
              <input
                id="email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                disabled={isLoading}
              />
              {emailError && (
                <span id="email-error" className="auth-error" aria-live="polite">{emailError}</span>
              )}
            </div>

            <div className="auth-field">
              <div className="auth-actions">
                <label htmlFor="password" className="auth-label">Password</label>
                <a href="#" className="auth-link">Forgot password?</a>
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

            <button 
              type="submit" 
              className="auth-btn auth-btn--primary" 
              disabled={isLoading}
            >
              {isLoading && <span className="auth-spinner" aria-hidden="true"></span>}
              {isLoading ? 'Signing in...' : 'Sign in securely'}
            </button>
          </form>

          <div className="auth-divider">or</div>

          <button 
            type="button" 
            className="auth-btn auth-btn--sso" 
            onClick={handleSso}
            disabled={isLoading}
          >
            Continue with organization SSO
          </button>

          <div className="auth-trust-note">
            <svg className="auth-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0110 0v4"></path>
            </svg>
            <span>Access is protected with encrypted, role-based controls.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
