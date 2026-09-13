import React, { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { BackButton } from '../components/BackButton';
import './sessions.css';

export const Route = createFileRoute('/evaluation')({
  component: EvaluationComponent,
});

function EvaluationComponent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit request');
      setIsSuccess(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Institutional evaluation</p>
      <h1 className="hero__title">Ask for a facilitator seat, not a consumer account</h1>

      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p>
            Evaluation includes a <Link to="/legal/dpa">DPA</Link>, the{' '}
            <Link to="/legal/data-processing">subprocessor list</Link>, and a look at the
            destruction receipt path — not a self-serve signup.
          </p>
          <p>
            Already provisioned? <Link to="/auth">Sign in as a facilitator</Link>.
          </p>

          {isSuccess ? (
            <p role="status">Request received. We keep only enough to reply — not a mailing list.</p>
          ) : (
            <form className="sessions-form" onSubmit={handleAccessRequest} style={{ maxWidth: 480 }}>
              <input type="text" name="bot_field" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />
              <div className="sessions-field">
                <label htmlFor="eval-email">Work email</label>
                <input id="eval-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="sessions-field">
                <label htmlFor="eval-use">What kind of sessions would you run?</label>
                <textarea id="eval-use" name="useCase" rows={4} />
              </div>
              {formError && (
                <p className="sessions-error" role="alert">
                  {formError}
                </p>
              )}
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Request evaluation'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
