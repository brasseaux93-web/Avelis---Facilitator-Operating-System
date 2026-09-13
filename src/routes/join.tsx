import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import './sessions.css';
import { apiPost } from '../lib/apiClient';
import { setPartyViewToken } from './party';
import { IDENTITY_CLASS_OPTIONS } from '../lib/identityLabels';
import { ProtocolMark } from '../components/Logo';

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
          identityClass: res.identityClass,
          partySessionToken: res.partySessionToken,
        } as Record<string, unknown>,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete invite redeem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sessions-page sessions-page--temporal">
      <ProtocolMark className="room-chamber__mark" accent="currentColor" width="32" height="32" />
      <p className="sessions-page__eyebrow">Temporary session</p>
      <h1 className="sessions-page__title">Enter a private room</h1>
      <p className="sessions-disclosure sessions-disclosure--persist" role="note">
        You do not create an account. This tab holds credentials in memory only. Avelis is a visible
        conflict agent in the live room. What you type may be sent to the session’s inference
        provider while the room is open. Avelis does not store the talk.
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
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="go"
            autoFocus
          />
        </div>
        <div className="sessions-field">
          <label htmlFor="identity">How you appear</label>
          <select
            id="identity"
            value={identityClass}
            onChange={(e) => setIdentityClass(e.target.value)}
          >
            {IDENTITY_CLASS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sessions-field">
          <label htmlFor="label">Display label (optional)</label>
          <input
            id="label"
            value={displayLabel}
            onChange={(e) => setDisplayLabel(e.target.value)}
            autoComplete="off"
            placeholder="e.g. Counsel for Party A"
          />
        </div>
        {error && (
          <p className="sessions-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Joining…' : 'Enter the room'}
        </button>
      </form>
    </div>
  );
}
