import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import './sessions.css';
import { apiPost } from '../lib/apiClient';

export const Route = createFileRoute('/join')({
  component: JoinPage,
});

function JoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [identityClass, setIdentityClass] = useState('role_only');
  const [displayLabel, setDisplayLabel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiPost<{
        partySessionToken: string;
        sessionId: string;
        partyId: string;
        roomToken: string;
        identityClass: string;
      }>('/api/invites/redeem', {
        code,
        identityClass,
        displayLabel: displayLabel || undefined,
      }, { auth: false });

      // Party credentials stay in memory via navigation state only — not localStorage.
      navigate({
        to: '/room/$sessionId',
        params: { sessionId: res.sessionId },
        state: {
          partyId: res.partyId,
          roomToken: res.roomToken,
          identityClass: res.identityClass,
          partySessionToken: res.partySessionToken,
        } as any,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete invite redeem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sessions-page">
      <h1 className="sessions-page__title">Join session</h1>
      <p className="sessions-disclosure" role="note">
        Room messages are delivered live and are not stored by Avelis.
      </p>
      <form className="sessions-form" onSubmit={redeem}>
        <div className="sessions-field">
          <label htmlFor="code">Invite code</label>
          <input id="code" value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="off" />
        </div>
        <div className="sessions-field">
          <label htmlFor="identity">Identity class</label>
          <select id="identity" value={identityClass} onChange={(e) => setIdentityClass(e.target.value)}>
            <option value="named">named</option>
            <option value="role_only">role_only</option>
            <option value="affiliation_only">affiliation_only</option>
            <option value="unnamed">unnamed</option>
          </select>
        </div>
        <div className="sessions-field">
          <label htmlFor="label">Display label (optional)</label>
          <input id="label" value={displayLabel} onChange={(e) => setDisplayLabel(e.target.value)} />
        </div>
        {error && <p className="sessions-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Joining…' : 'Join'}
        </button>
      </form>
    </div>
  );
}
