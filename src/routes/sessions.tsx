import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import './sessions.css';
import { useFacilitatorAuth } from '../lib/FacilitatorAuthContext';
import { apiGet, apiPost } from '../lib/apiClient';

export const Route = createFileRoute('/sessions')({
  component: SessionsPage,
});

type SessionRow = {
  id: string;
  title: string;
  status: string;
  retentionHours: number;
  createdAt: string;
};

function SessionsPage() {
  const { isAuthenticated, facilitator, clearSession, token } = useFacilitatorAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [title, setTitle] = useState('');
  const [retentionHours, setRetentionHours] = useState(72);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth' });
    }
  }, [isAuthenticated, navigate]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const rows = await apiGet<SessionRow[]>('/api/sessions');
      setSessions(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not list sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, token]);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const created = await apiPost<SessionRow>('/api/sessions', {
        title,
        retentionHours: Number(retentionHours),
      });
      setTitle('');
      navigate({ to: '/sessions/$sessionId', params: { sessionId: created.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create session.');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="sessions-page">
      <div className="sessions-page__header">
        <div>
          <p className="sessions-page__eyebrow">Facilitator console</p>
          <h1 className="sessions-page__title">Sessions</h1>
          <p className="sessions-page__subtitle">
            {facilitator?.displayName} · {facilitator?.email}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            clearSession();
            navigate({ to: '/auth' });
          }}
        >
          Sign out
        </button>
      </div>

      <p className="sessions-disclosure sessions-disclosure--persist" role="note">
        Room messages are delivered live and are not stored by Avelis. Process records and any
        joint minute are retained until the selected destruction deadline, then destroyed.
      </p>

      <form className="sessions-form" onSubmit={createSession}>
        <h2 style={{ margin: 0, fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          Create session
        </h2>
        <div className="sessions-form__row">
          <div className="sessions-field">
            <label htmlFor="session-title">Title</label>
            <input
              id="session-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="sessions-field" style={{ maxWidth: 200 }}>
            <label htmlFor="retention">Retain process records for (hours)</label>
            <input
              id="retention"
              type="number"
              min={0}
              max={720}
              value={retentionHours}
              onChange={(e) => setRetentionHours(Number(e.target.value))}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Create session
          </button>
        </div>
        {error && (
          <p className="sessions-error" role="alert">
            {error}
          </p>
        )}
      </form>

      {loading ? (
        <p className="sessions-page__subtitle">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="sessions-empty" role="status">
          <p className="sessions-empty__title">No sessions yet</p>
          <p className="sessions-empty__body">
            Create a session above to open a live room and process ledger. Room messages are
            delivered live and are not stored by Avelis.
          </p>
        </div>
      ) : (
        <ul className="sessions-list">
          {sessions.map((s) => (
            <li key={s.id} className="sessions-list__item">
              <div>
                <Link to="/sessions/$sessionId" params={{ sessionId: s.id }}>
                  {s.title}
                </Link>
                <div className="sessions-list__meta">Retention {s.retentionHours}h</div>
              </div>
              <span className="sessions-status" data-status={s.status}>
                {s.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
