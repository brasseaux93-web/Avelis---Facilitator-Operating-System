import { createFileRoute, Link } from '@tanstack/react-router';
import React, { useCallback, useEffect, useState } from 'react';
import './sessions.css';
import { apiGet, apiPost } from '../lib/apiClient';

export const Route = createFileRoute('/party')({
  component: PartyViewPage,
});

type LedgerLine = {
  id: string;
  sequenceNumber: number;
  lineType: string;
  occurredAt: string;
  initialVisibility: string;
};

type MinutePayload = {
  minute: {
    id: string;
    status: string;
    content: string;
    contentDigest: string | null;
    initialedBy: string[];
  } | null;
  emptyState?: string;
};

/**
 * Party view after join: visible ledger lines + published minute.
 * Party token is held in memory (module) only — not localStorage.
 */
let memoryPartyToken: string | null = null;

export function setPartyViewToken(token: string | null) {
  memoryPartyToken = token;
}

function PartyViewPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState<string | null>(memoryPartyToken);
  const [lines, setLines] = useState<LedgerLine[]>([]);
  const [emptyLedger, setEmptyLedger] = useState<string | undefined>();
  const [minute, setMinute] = useState<MinutePayload['minute']>(null);
  const [emptyMinute, setEmptyMinute] = useState<string | undefined>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const refresh = useCallback(async (partyToken: string) => {
    setError('');
    try {
      const ledger = await apiGet<{
        sessionId: string;
        lines: LedgerLine[];
        emptyState?: string;
      }>('/api/party/session/ledger', { token: partyToken });
      setLines(ledger.lines);
      setEmptyLedger(ledger.emptyState);
      setSessionId(ledger.sessionId);

      const m = await apiGet<MinutePayload>('/api/party/session/minute', { token: partyToken });
      setMinute(m.minute);
      setEmptyMinute(m.emptyState);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load party view.');
    }
  }, []);

  useEffect(() => {
    if (token) void refresh(token);
  }, [token, refresh]);

  const useToken = (e: React.FormEvent) => {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    memoryPartyToken = t;
    setToken(t);
  };

  const initialMinute = async () => {
    if (!token || !sessionId || !minute) return;
    setInfo('');
    try {
      await apiPost(
        `/api/sessions/${sessionId}/minute/initial`,
        {},
        { token }
      );
      setInfo('Minute initial recorded.');
      await refresh(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record minute initial.');
    }
  };

  return (
    <div className="sessions-page">
      <p className="sessions-page__eyebrow">Party view</p>
      <h1 className="sessions-page__title">Session process (party)</h1>
      <p className="sessions-disclosure" role="note">
        Room messages are delivered live and are not stored by Avelis. This view shows only process
        lines published to parties and any published joint minute.
      </p>

      {!token && (
        <form className="sessions-form" onSubmit={useToken}>
          <p className="sessions-page__subtitle">
            After redeeming an invite on <Link to="/join">/join</Link>, paste the party session
            token here (memory only for this tab). Prefer navigating from join when wired.
          </p>
          <div className="sessions-field">
            <label htmlFor="party-token">Party session token</label>
            <input
              id="party-token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Load party view
          </button>
        </form>
      )}

      {error && (
        <p className="sessions-error" role="alert">
          {error}
        </p>
      )}
      {info && <p className="sessions-page__subtitle">{info}</p>}

      {token && (
        <>
          <div className="sessions-panel">
            <h3>Visible ledger</h3>
            {lines.length === 0 ? (
              <div className="sessions-empty">
                <p className="sessions-empty__title">No visible process lines</p>
                <p className="sessions-empty__body">
                  {emptyLedger || 'No process lines are visible to parties yet.'}
                </p>
              </div>
            ) : (
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.sequenceNumber}</td>
                      <td>{line.lineType}</td>
                      <td>{new Date(line.occurredAt).toISOString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="sessions-panel">
            <h3>Joint minute</h3>
            {!minute ? (
              <div className="sessions-empty">
                <p className="sessions-empty__title">No published minute</p>
                <p className="sessions-empty__body">
                  {emptyMinute || 'No joint minute is published for parties.'}
                </p>
              </div>
            ) : (
              <>
                <p className="sessions-page__subtitle">
                  The joint minute is optional. It is separate from the live room and may be
                  exported or wiped.
                </p>
                <pre className="sessions-code-once" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                  {minute.content}
                </pre>
                <div className="sessions-actions">
                  <button type="button" className="btn btn--primary" onClick={initialMinute}>
                    Record initial
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
