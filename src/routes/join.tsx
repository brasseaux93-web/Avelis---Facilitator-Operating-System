import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import './sessions.css';
import { apiPost } from '../lib/apiClient';
import { setPartyViewToken } from './party';

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
        supabaseToken: string;
        identityClass: string;
      }>(
        '/api/invites/redeem',
        {
          code,
          identityClass,
          displayLabel: displayLabel || undefined,
        },
        { auth: false }
      );

      setPartyViewToken(res.partySessionToken);
      navigate({
        to: '/room/$sessionId',
        params: { sessionId: res.sessionId },
        state: {
          partyId: res.partyId,
          roomToken: res.roomToken,
          supabaseToken: res.supabaseToken,
          identityClass: res.identityClass,
          partySessionToken: res.partySessionToken,
          isHost: false,
        } as Record<string, unknown>,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete invite redeem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sessions-page">
      <p className="sessions-page__eyebrow">Party access</p>
      <h1 className="sessions-page__title">Join session</h1>
      <p className="sessions-disclosure sessions-disclosure--persist" role="note">
        Room messages are delivered live and are not stored by Avelis. Credentials for this
        session stay in memory only for the active browser tab.
      </p>
      <form className="sessions-form" onSubmit={redeem}>
        <div className="sessions-field">
          <label htmlFor="code">Invite code</label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoComplete="off"
            autoFocus
          />
        </div>
        <div className="sessions-field">
          <label htmlFor="identity">Identity class</label>
          <select
            id="identity"
            value={identityClass}
            onChange={(e) => setIdentityClass(e.target.value)}
          >
            <option value="named">named</option>
            <option value="role_only">role_only</option>
            <option value="affiliation_only">affiliation_only</option>
            <option value="unnamed">unnamed</option>
          </select>
        </div>
        <div className="sessions-field">
          <label htmlFor="label">Display label (optional)</label>
          <input
            id="label"
            value={displayLabel}
            onChange={(e) => setDisplayLabel(e.target.value)}
            autoComplete="off"
          />
        </div>
        {error && (
          <p className="sessions-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Joining…' : 'Join'}
        </button>
      </form>
      <p className="sessions-page__subtitle">
        After joining, process lines published to parties are on <Link to="/party">/party</Link>.
      </p>
    </div>
  );
}
