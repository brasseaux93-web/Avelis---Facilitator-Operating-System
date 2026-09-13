import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import React, { useCallback, useEffect, useState } from 'react';
import './sessions.css';
import { useFacilitatorAuth } from '../lib/FacilitatorAuthContext';
import { apiGet, apiPatch, apiPost } from '../lib/apiClient';

export const Route = createFileRoute('/sessions/$sessionId')({
  component: SessionConsolePage,
});

type AgendaItem = { id: string; title: string; status: string; sortOrder: number };
type Party = { id: string; identityClass: string; displayLabel: string; inviteStatus: string };
type LedgerLine = {
  id: string;
  sequenceNumber: number;
  lineType: string;
  occurredAt: string;
  initialVisibility: string;
};
type SessionDetail = {
  session: {
    id: string;
    title: string;
    status: string;
    retentionHours: number;
    retentionExpiresAt: string | null;
    openedAt: string | null;
    closedAt: string | null;
  };
  parties: Party[];
  agenda: AgendaItem[];
  minute: { id: string; status: string; content: string | null } | null;
};

function SessionConsolePage() {
  const { sessionId } = Route.useParams();
  const { isAuthenticated, token } = useFacilitatorAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [ledger, setLedger] = useState<LedgerLine[]>([]);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteLabel, setInviteLabel] = useState('Party');
  const [inviteClass, setInviteClass] = useState('role_only');
  const [agendaTitle, setAgendaTitle] = useState('');
  const [minuteContent, setMinuteContent] = useState('');
  const [exportMd, setExportMd] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/auth' });
  }, [isAuthenticated, navigate]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const d = await apiGet<SessionDetail>(`/api/sessions/${sessionId}`);
      setDetail(d);
      setMinuteContent(d.minute?.content || '');
      const lines = await apiGet<LedgerLine[]>(`/api/sessions/${sessionId}/ledger`);
      setLedger(lines);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load session.');
    }
  }, [sessionId, token]);

  useEffect(() => {
    if (isAuthenticated) void refresh();
  }, [isAuthenticated, refresh]);

  const openSession = async () => {
    try {
      await apiPost(`/api/sessions/${sessionId}/open`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open session.');
    }
  };

  const closeSession = async () => {
    try {
      await apiPost(`/api/sessions/${sessionId}/close`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not close session.');
    }
  };

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteCode(null);
    try {
      const res = await apiPost<{ inviteCode: string }>(`/api/sessions/${sessionId}/invites`, {
        identityClass: inviteClass,
        displayLabel: inviteLabel,
      });
      setInviteCode(res.inviteCode);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invite.');
    }
  };

  const addAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost(`/api/sessions/${sessionId}/agenda`, { title: agendaTitle });
      setAgendaTitle('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create agenda item.');
    }
  };

  const markAgenda = async (itemId: string, status: string) => {
    try {
      await apiPatch(`/api/sessions/${sessionId}/agenda/${itemId}`, { status });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update agenda item.');
    }
  };

  const saveMinute = async () => {
    try {
      await apiPost(`/api/sessions/${sessionId}/minute`, { content: minuteContent });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update joint minute.');
    }
  };

  const publishMinute = async () => {
    try {
      await apiPost(`/api/sessions/${sessionId}/minute/publish`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish joint minute.');
    }
  };

  const wipeMinute = async () => {
    try {
      await apiPost(`/api/sessions/${sessionId}/minute/wipe`);
      setMinuteContent('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not wipe joint minute.');
    }
  };

  const exportMinute = async () => {
    try {
      const text = await apiGet<string>(`/api/sessions/${sessionId}/minute/export.md`);
      setExportMd(typeof text === 'string' ? text : String(text));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export joint minute.');
    }
  };

  const publishLine = async (lineId: string) => {
    try {
      await apiPost(`/api/sessions/${sessionId}/ledger/publish`, { lineId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish ledger line.');
    }
  };

  if (!isAuthenticated || !detail) {
    return (
      <div className="sessions-page">
        <p className="sessions-page__subtitle">{error || 'Loading…'}</p>
      </div>
    );
  }

  const s = detail.session;
  const roomLink = `/join`;

  return (
    <div className="sessions-page">
      <p className="sessions-page__subtitle">
        <Link to="/sessions">← Sessions</Link>
      </p>
      <div className="sessions-page__header">
        <div>
          <h1 className="sessions-page__title">{s.title}</h1>
          <p className="sessions-page__subtitle">
            Status <span className="sessions-status">{s.status}</span> · Retain process records for {s.retentionHours}h
          </p>
        </div>
      </div>

      <p className="sessions-disclosure" role="note">
        Room messages are delivered live and are not stored by Avelis.
        Closing ends room access and destroys the live room. Messages cannot be recovered.
        The joint minute is optional. It is separate from the live room and may be exported or wiped.
      </p>

      {error && <p className="sessions-error" role="alert">{error}</p>}

      <div className="sessions-panel">
        <h3>Session controls</h3>
        <div className="sessions-actions">
          <button type="button" className="btn btn--primary" onClick={openSession} disabled={s.status !== 'draft'}>
            Open session
          </button>
          <button type="button" className="btn btn--secondary" onClick={closeSession} disabled={s.status !== 'open'}>
            Close session
          </button>
        </div>
        <p className="sessions-page__subtitle">
          Party join path: <code>{roomLink}</code> (redeem invite code). Facilitator room monitoring is not part of MVP UI.
        </p>
      </div>

      <div className="sessions-panel">
        <h3>Create invite</h3>
        <form className="sessions-form" onSubmit={createInvite}>
          <div className="sessions-form__row">
            <div className="sessions-field">
              <label htmlFor="invite-label">Display label</label>
              <input id="invite-label" value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)} required />
            </div>
            <div className="sessions-field">
              <label htmlFor="invite-class">Identity class</label>
              <select id="invite-class" value={inviteClass} onChange={(e) => setInviteClass(e.target.value)}>
                <option value="named">named</option>
                <option value="role_only">role_only</option>
                <option value="affiliation_only">affiliation_only</option>
                <option value="unnamed">unnamed</option>
              </select>
            </div>
            <button type="submit" className="btn btn--primary">Create invite</button>
          </div>
        </form>
        {inviteCode && (
          <div>
            <p className="sessions-page__subtitle">Invite code (shown once — copy now):</p>
            <div className="sessions-code-once">{inviteCode}</div>
          </div>
        )}
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Class</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {detail.parties.map((p) => (
              <tr key={p.id}>
                <td>{p.displayLabel}</td>
                <td>{p.identityClass}</td>
                <td>{p.inviteStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sessions-panel">
        <h3>Agenda</h3>
        <form className="sessions-form" onSubmit={addAgenda}>
          <div className="sessions-form__row">
            <div className="sessions-field">
              <label htmlFor="agenda-title">Item title</label>
              <input id="agenda-title" value={agendaTitle} onChange={(e) => setAgendaTitle(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn--primary">Table item</button>
          </div>
        </form>
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {detail.agenda.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.status}</td>
                <td>
                  <div className="sessions-actions">
                    {(['agreed', 'parked', 'refused', 'tabled'] as const).map((st) => (
                      <button key={st} type="button" className="btn btn--secondary" onClick={() => markAgenda(item.id, st)}>
                        {st}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sessions-panel">
        <h3>Ledger</h3>
        <table className="sessions-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Visibility</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((line) => (
              <tr key={line.id}>
                <td>{line.sequenceNumber}</td>
                <td>{line.lineType}</td>
                <td>{line.initialVisibility}</td>
                <td>
                  <button type="button" className="btn btn--secondary" onClick={() => publishLine(line.id)}>
                    Publish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sessions-panel">
        <h3>Joint minute</h3>
        <p className="sessions-page__subtitle">
          The joint minute is optional. It is separate from the live room and may be exported or wiped.
        </p>
        <div className="sessions-field">
          <label htmlFor="minute">Draft content</label>
          <textarea
            id="minute"
            rows={8}
            value={minuteContent}
            onChange={(e) => setMinuteContent(e.target.value)}
          />
        </div>
        <div className="sessions-actions">
          <button type="button" className="btn btn--primary" onClick={saveMinute}>Save draft</button>
          <button type="button" className="btn btn--secondary" onClick={publishMinute}>Publish</button>
          <button type="button" className="btn btn--secondary" onClick={exportMinute}>Export markdown</button>
          <button type="button" className="btn btn--secondary" onClick={wipeMinute}>Wipe minute</button>
        </div>
        {detail.minute && (
          <p className="sessions-page__subtitle">Minute status: {detail.minute.status}</p>
        )}
        {exportMd && (
          <pre className="sessions-code-once" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{exportMd}</pre>
        )}
      </div>
    </div>
  );
}
