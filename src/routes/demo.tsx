import { createFileRoute, Link } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import './sessions.css';
import { apiGet, apiPost } from '../lib/apiClient';

export const Route = createFileRoute('/demo')({
  component: DemoPage,
});

type DemoStatus = {
  demoSeedEnabled: boolean;
  prepareAllowed: boolean;
  sessionId: string | null;
  paths: { demoPage: string; auth: string; sessions: string; join: string; demoScript: string };
};

type PrepareResult = {
  facilitatorEmailHint: string;
  sessionId: string | null;
  joinPath: string;
  instructions: string[];
};

function DemoPage() {
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [prepared, setPrepared] = useState<PrepareResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const s = await apiGet<DemoStatus>('/api/demo/status', { auth: false });
        setStatus(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load demo status.');
      }
    })();
  }, []);

  const prepare = async () => {
    setError('');
    try {
      const res = await apiPost<PrepareResult>('/api/demo/prepare', undefined, { auth: false });
      setPrepared(res);
      const s = await apiGet<DemoStatus>('/api/demo/status', { auth: false });
      setStatus(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not prepare demo.');
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const joinTemplate = `${typeof window !== 'undefined' ? window.location.origin : ''}/join`;
  const sessionPath =
    prepared?.sessionId || status?.sessionId
      ? `/sessions/${prepared?.sessionId || status?.sessionId}`
      : '/sessions';

  return (
    <div className="sessions-page">
      <p className="sessions-page__eyebrow">Investor path</p>
      <h1 className="sessions-page__title">Demo</h1>
      <p className="sessions-disclosure" role="note">
        Facilitator-facing walkthrough. No AI features. Room messages are delivered live and are
        not stored by Avelis. This page does not claim legal privilege or confidentiality beyond
        implemented technical controls.
      </p>

      {error && (
        <p className="sessions-error" role="alert">
          {error}
        </p>
      )}

      <div className="sessions-panel">
        <h3>Status</h3>
        {!status ? (
          <p className="sessions-page__subtitle">Loading…</p>
        ) : (
          <ul className="sessions-page__subtitle" style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>Demo seed enabled: {status.demoSeedEnabled ? 'yes' : 'no'}</li>
            <li>Prepare allowed: {status.prepareAllowed ? 'yes' : 'no'}</li>
            <li>Draft session id: {status.sessionId || 'none yet'}</li>
          </ul>
        )}
        <div className="sessions-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={prepare}
            disabled={status ? !status.prepareAllowed : false}
          >
            Prepare demo seed
          </button>
        </div>
        {prepared && (
          <div>
            <p className="sessions-page__subtitle">
              Facilitator email hint: <code>{prepared.facilitatorEmailHint}</code> (password is not
              returned by the API — use your local seed password).
            </p>
            <ol className="sessions-page__subtitle" style={{ paddingLeft: '1.2rem' }}>
              {prepared.instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="sessions-panel">
        <h3>Steps (from demo script)</h3>
        <ol className="sessions-page__subtitle" style={{ paddingLeft: '1.2rem', lineHeight: 1.6 }}>
          <li>Sign in as the seed facilitator.</li>
          <li>Open sessions and create or use the draft demo session.</li>
          <li>Create an invite; copy the one-time code (shown once).</li>
          <li>In a private window, open /join and redeem the code.</li>
          <li>Send live room messages; late joiners have no history.</li>
          <li>Table agenda items; show ledger process lines (not speech).</li>
          <li>Optional joint minute; close session; retention then destruction receipt.</li>
        </ol>
        <div className="sessions-actions">
          <Link to="/auth" className="btn btn--primary">
            Sign in
          </Link>
          <Link to="/sessions" className="btn btn--secondary">
            Open sessions
          </Link>
          {sessionPath.startsWith('/sessions/') ? (
            <a href={sessionPath} className="btn btn--secondary">
              Open demo session
            </a>
          ) : null}
          <Link to="/join" className="btn btn--secondary">
            Join page
          </Link>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => copy(joinTemplate, 'join')}
          >
            {copied === 'join' ? 'Copied join URL' : 'Copy join URL template'}
          </button>
        </div>
      </div>

      <div className="sessions-panel">
        <h3>Factual disclosures</h3>
        <ul className="sessions-page__subtitle" style={{ paddingLeft: '1.2rem', lineHeight: 1.55 }}>
          <li>Room messages are delivered live and are not stored by Avelis.</li>
          <li>Closing ends room access and destroys the live room. Messages cannot be recovered.</li>
          <li>The joint minute is optional. It is separate from the live room and may be exported or wiped.</li>
          <li>Session records were destroyed. The destruction receipt remains. (after purge)</li>
          <li>v1 has no AI. Parties have no standing accounts.</li>
        </ul>
        <p className="sessions-page__subtitle">
          Full script:{' '}
          <a href="https://github.com/brasseaux93-web/Avelis---Facilitator-Operating-System/blob/main/docs/demo-script.md">
            docs/demo-script.md
          </a>{' '}
          (also in-repo).
        </p>
      </div>
    </div>
  );
}
