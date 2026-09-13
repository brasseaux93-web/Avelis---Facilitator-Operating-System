import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import React, { useCallback, useEffect, useState } from 'react';
import './sessions.css';
import { useFacilitatorAuth } from '../lib/FacilitatorAuthContext';
import { downloadPdfBytes, renderMinutePdfBytes } from '../lib/minutePdf';
import { renderReceiptPdfBytes } from '../lib/receiptPdf';
import { apiGet, apiPatch, apiPost } from '../lib/apiClient';
import { IDENTITY_CLASS_OPTIONS, identityClassLabel } from '../lib/identityLabels';
import { ProcessAgent, type CopilotAction, type CopilotState } from '../components/ProcessAgent';

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
    purgedAt?: string | null;
  };
  parties: Party[];
  agenda: AgendaItem[];
  minute: { id: string; status: string; content: string | null } | null;
};
type DestructionReceipt = {
  id: string;
  purgedAt: string;
  retentionWindow: string;
  bodiesDestroyed: string[];
  finalSequenceNumber: number;
  ledgerRootHash: string;
  destructionManifestDigest: string;
  attestedByKind: string;
  disclosure?: string;
};

function SessionConsolePage() {
  const { sessionId } = Route.useParams();
  const { isAuthenticated, token } = useFacilitatorAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [ledger, setLedger] = useState<LedgerLine[]>([]);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteChannel, setInviteChannel] = useState<'copy_link' | 'email'>('copy_link');
  const [inviteNote, setInviteNote] = useState('');
  const [codesByParty, setCodesByParty] = useState<Record<string, string>>({});
  const [inviteLabel, setInviteLabel] = useState('Party');
  const [inviteClass, setInviteClass] = useState('role_only');
  const [deliverEmail, setDeliverEmail] = useState('');
  const [agendaTitle, setAgendaTitle] = useState('');
  const [minuteContent, setMinuteContent] = useState('');
  const [exportMd, setExportMd] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<DestructionReceipt | null>(null);
  const [receiptValid, setReceiptValid] = useState<boolean | null>(null);
  const [joinUrlHint, setJoinUrlHint] = useState('/join');
  const [enteringRoom, setEnteringRoom] = useState(false);
  const [copilot, setCopilot] = useState<CopilotState | null>(null);
  const [copilotBusy, setCopilotBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/auth' });
  }, [isAuthenticated, navigate]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const d = (await apiGet('/api/sessions/' + sessionId)) as SessionDetail;
      setDetail(d);
      setMinuteContent(d.minute?.content || '');
      setLedger((await apiGet('/api/sessions/' + sessionId + '/ledger')) as LedgerLine[]);
      if (d.session.status === 'purged') {
        try {
          setReceipt(
            (await apiGet('/api/sessions/' + sessionId + '/destruction-receipt')) as DestructionReceipt
          );
          const v = (await apiGet('/api/sessions/' + sessionId + '/destruction-receipt/verify')) as {
            valid: boolean;
          };
          setReceiptValid(v.valid);
        } catch {
          setReceipt(null);
          setReceiptValid(null);
        }
      } else {
        setReceipt(null);
        setReceiptValid(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load session.');
    }
  }, [sessionId, token]);

  useEffect(() => {
    if (isAuthenticated) void refresh();
  }, [isAuthenticated, refresh]);

  const showCodeOnce = (code: string, partyId?: string, channel: 'copy_link' | 'email' = 'copy_link', note = '') => {
    setInviteCode(code);
    setInviteChannel(channel);
    setInviteNote(note);
    setInviteModalOpen(true);
    if (partyId) {
      setCodesByParty((prev) => ({ ...prev, [partyId]: code }));
    }
  };

  const openSession = async () => {
    try {
      await apiPost('/api/sessions/' + sessionId + '/open');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open session.');
    }
  };

  const closeSession = async () => {
    try {
      await apiPost('/api/sessions/' + sessionId + '/close');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not close session.');
    }
  };

  const enterLiveRoom = async () => {
    setEnteringRoom(true);
    setError('');
    try {
      const access = (await apiPost('/api/sessions/' + sessionId + '/room-access')) as {
        partyId: string;
        roomToken: string;
        identityClass: string;
      };
      navigate({
        to: '/room/$sessionId',
        params: { sessionId },
        state: {
          partyId: access.partyId,
          roomToken: access.roomToken,
          identityClass: access.identityClass,
        } as Record<string, unknown>,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open live room.');
    } finally {
      setEnteringRoom(false);
    }
  };

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteCode(null);
    setError('');
    try {
      const res = (await apiPost('/api/sessions/' + sessionId + '/invites', {
        identityClass: inviteClass,
        displayLabel: inviteLabel,
      })) as { inviteCode: string; party: { id: string } };
      const address = deliverEmail.trim();
      if (address) {
        const delivered = (await apiPost(
          '/api/sessions/' + sessionId + '/invites/' + res.party.id + '/deliver',
          { deliveryAddress: address }
        )) as { delivered: boolean; channel: string; inviteCode?: string; joinUrl?: string };
        if (delivered.joinUrl) setJoinUrlHint(delivered.joinUrl);
        if (delivered.delivered) {
          showCodeOnce(
            delivered.inviteCode || res.inviteCode,
            res.party.id,
            'email',
            'Sent. If it does not arrive, copy the link. The address is wiped when they join.'
          );
        } else {
          showCodeOnce(
            delivered.inviteCode || res.inviteCode,
            res.party.id,
            'copy_link',
            'Email is not configured, or the send failed. Give them this code. The link still works.'
          );
        }
      } else {
        showCodeOnce(res.inviteCode, res.party.id, 'copy_link', 'No email was sent. Copy the code. It is shown once.');
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invite.');
    }
  };

  const resendInvite = async (partyId: string) => {
    try {
      const res = (await apiPost(
        '/api/sessions/' + sessionId + '/invites/' + partyId + '/resend'
      )) as { inviteCode: string };
      showCodeOnce(res.inviteCode, partyId, 'copy_link', 'New code. The previous code no longer works.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend invite.');
    }
  };

  const revokeInvite = async (partyId: string) => {
    try {
      await apiPost('/api/sessions/' + sessionId + '/invites/' + partyId + '/revoke');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke invite.');
    }
  };

  const deliverInvite = async (partyId: string) => {
    try {
      const res = (await apiPost('/api/sessions/' + sessionId + '/invites/' + partyId + '/deliver', {
        deliveryAddress: deliverEmail || undefined,
      })) as { delivered: boolean; channel: string; inviteCode?: string; joinUrl?: string };
      if (res.joinUrl) setJoinUrlHint(res.joinUrl);
      if (res.delivered) {
        showCodeOnce(
          res.inviteCode || codesByParty[partyId] || '',
          partyId,
          'email',
          'Sent. Copy-link remains if the mail does not arrive.'
        );
      } else if (res.inviteCode) {
        showCodeOnce(
          res.inviteCode,
          partyId,
          'copy_link',
          'Email is not configured, or the send failed. Give them this code.'
        );
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not deliver invite.');
    }
  };

  const copyJoinLink = async (code?: string | null) => {
    if (!code) {
      setError('The code was shown once. Resend to issue a new one, then copy.');
      return;
    }
    const url = `${window.location.origin}/join?code=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError('Could not copy join link.');
    }
  };

  const addAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost('/api/sessions/' + sessionId + '/agenda', { title: agendaTitle });
      setAgendaTitle('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create agenda item.');
    }
  };

  const markAgenda = async (itemId: string, status: string) => {
    try {
      await apiPatch('/api/sessions/' + sessionId + '/agenda/' + itemId, { status });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update agenda item.');
    }
  };

  const saveMinute = async () => {
    try {
      await apiPost('/api/sessions/' + sessionId + '/minute', { content: minuteContent });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update joint minute.');
    }
  };

  const publishMinute = async () => {
    try {
      await apiPost('/api/sessions/' + sessionId + '/minute/publish');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish joint minute.');
    }
  };

  const wipeMinute = async () => {
    try {
      await apiPost('/api/sessions/' + sessionId + '/minute/wipe');
      setMinuteContent('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not wipe joint minute.');
    }
  };

  const exportMinute = async () => {
    try {
      const text = await apiGet('/api/sessions/' + sessionId + '/minute/export.md');
      setExportMd(typeof text === 'string' ? text : String(text));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export joint minute.');
    }
  };

  const exportMinutePdf = async () => {
    if (!minuteContent.trim()) {
      setError('Save a draft before exporting.');
      return;
    }
    try {
      const bytes = renderMinutePdfBytes({
        title: detail?.session?.title || 'Joint minute',
        status: detail?.minute?.status || 'draft',
        body: minuteContent,
        exportedAt: new Date().toISOString(),
      });
      downloadPdfBytes(bytes, 'avelis-joint-minute.pdf');
      await apiPost('/api/sessions/' + sessionId + '/minute/export-ack', { format: 'pdf' });
      setExportMd(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export joint minute.');
    }
  };

  const publishLine = async (lineId: string) => {
    try {
      await apiPost('/api/sessions/' + sessionId + '/ledger/publish', { lineId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish ledger line.');
    }
  };

  const withdrawLine = async (lineId: string) => {
    try {
      await apiPost('/api/sessions/' + sessionId + '/ledger/withdraw', { lineId });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not withdraw ledger line.');
    }
  };

  const consultCopilot = async () => {
    setCopilotBusy(true);
    setError('');
    try {
      const result = (await apiPost('/api/sessions/' + sessionId + '/process-copilot')) as CopilotState;
      setCopilot(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not run process copilot.');
    } finally {
      setCopilotBusy(false);
    }
  };

  const applyCopilotAction = async (action: CopilotAction) => {
    setError('');
    try {
      switch (action.kind) {
        case 'open_session':
          await apiPost('/api/sessions/' + sessionId + '/open');
          break;
        case 'close_session':
          await apiPost('/api/sessions/' + sessionId + '/close');
          break;
        case 'invite_party':
          setInviteLabel('Party');
          break;
        case 'table_agenda': {
          const title = typeof action.payload.title === 'string' ? action.payload.title : 'Issue for discussion';
          await apiPost('/api/sessions/' + sessionId + '/agenda', { title });
          break;
        }
        case 'mark_agenda': {
          const itemId = String(action.payload.itemId || '');
          const status = String(action.payload.status || '');
          if (itemId && status) {
            await apiPatch('/api/sessions/' + sessionId + '/agenda/' + itemId, { status });
          }
          break;
        }
        case 'open_caucus':
          await apiPost('/api/sessions/' + sessionId + '/caucus', { action: 'open' });
          break;
        case 'close_caucus':
          await apiPost('/api/sessions/' + sessionId + '/caucus', { action: 'close' });
          if (action.payload.mark) {
            await apiPost('/api/sessions/' + sessionId + '/process-marks', { mark: action.payload.mark });
          }
          break;
        case 'process_mark':
          await apiPost('/api/sessions/' + sessionId + '/process-marks', { mark: action.payload.mark });
          break;
        case 'draft_joint_minute':
          if (copilot?.minuteOutline) setMinuteContent(copilot.minuteOutline);
          break;
        case 'publish_joint_minute':
          await apiPost('/api/sessions/' + sessionId + '/minute/publish');
          break;
        default:
          break;
      }
      await refresh();
      await consultCopilot();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply process action.');
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

  return (
    <div className="sessions-page sessions-page--console">
      <div className="sessions-page__main">
      <p className="sessions-page__subtitle">
        <Link to="/sessions">← Sessions</Link>
      </p>
      <div className="sessions-page__header">
        <div>
          <p className="sessions-page__eyebrow">Facilitator console</p>
          <h1 className="sessions-page__title">{s.title}</h1>
          <p className="sessions-page__subtitle">
            Status <span className="sessions-status" data-status={s.status}>{s.status}</span>
            {' · '}Retain process records for {s.retentionHours}h
          </p>
        </div>
      </div>

      <p className="sessions-disclosure" role="note">
        Room messages are delivered live and are not stored by Avelis. Closing ends room access and
        destroys the live room. Messages cannot be recovered. The joint minute is optional. It is
        separate from the live room and may be exported or wiped.
      </p>
      {error && (
        <p className="sessions-error" role="alert">
          {error}
        </p>
      )}

      {inviteModalOpen && inviteCode && (
        <div className="sessions-panel" role="dialog" aria-labelledby="invite-code-title">
          <h3 id="invite-code-title">
            {inviteChannel === 'email' ? 'Invite sent' : 'One-time invite code'}
          </h3>
          <p className="sessions-page__subtitle">
            {inviteNote || 'Shown once. It will not be logged.'}
          </p>
          <div className="sessions-code-once">{inviteCode}</div>
          <div className="sessions-actions">
            <button type="button" className="btn btn--primary" onClick={() => void copyJoinLink(inviteCode)}>
              Copy link + code
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setInviteModalOpen(false);
                setInviteCode(null);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="sessions-panel">
        <h3>Session controls</h3>
        <div className="sessions-actions">
          {s.status === 'open' ? (
            <>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void enterLiveRoom()}
                disabled={enteringRoom}
              >
                {enteringRoom ? 'Opening room…' : 'Enter live room'}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => void closeSession()}>
                Close session
              </button>
            </>
          ) : s.status === 'closed' || s.status === 'purged' ? (
            <p className="sessions-page__subtitle">
              {s.status === 'purged'
                ? 'Session records were destroyed. The destruction receipt remains.'
                : 'Session is closed. The live room is gone. Process records remain until the destruction deadline.'}
            </p>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void openSession()}
              disabled={s.status !== 'draft'}
            >
              Open session
            </button>
          )}
        </div>
        <p className="sessions-page__subtitle">
          Parties join at <code>{joinUrlHint}</code> with a one-time invite. They do not create
          accounts.
        </p>
      </div>

      <div className="sessions-panel">
        <h3>Invites</h3>
        <form className="sessions-form" onSubmit={createInvite}>
          <div className="sessions-form__row">
            <div className="sessions-field">
              <label htmlFor="invite-label">Display label</label>
              <input
                id="invite-label"
                value={inviteLabel}
                onChange={(e) => setInviteLabel(e.target.value)}
                required
              />
            </div>
            <div className="sessions-field">
              <label htmlFor="invite-class">How they appear</label>
              <select
                id="invite-class"
                value={inviteClass}
                onChange={(e) => setInviteClass(e.target.value)}
              >
                {IDENTITY_CLASS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn--primary">
              Create invite
            </button>
          </div>
          <div className="sessions-field">
            <label htmlFor="deliver-email">Delivery email (optional — not kept after they join)</label>
            <input
              id="deliver-email"
              type="email"
              value={deliverEmail}
              onChange={(e) => setDeliverEmail(e.target.value)}
              placeholder="party@example.com"
              autoComplete="off"
            />
          </div>
        </form>
        {detail.parties.length === 0 ? (
          <div className="sessions-empty">
            <p className="sessions-empty__title">No parties yet</p>
            <p className="sessions-empty__body">
              Create an invite to issue a one-time code. Parties have no standing accounts.
            </p>
          </div>
        ) : (
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>How they appear</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {detail.parties.map((p) => (
                <tr key={p.id}>
                  <td>{p.displayLabel}</td>
                  <td>{identityClassLabel(p.identityClass)}</td>
                  <td>{p.inviteStatus}</td>
                  <td>
                    <div className="sessions-actions">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => void copyJoinLink(codesByParty[p.id])}
                      >
                        Copy link
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => void resendInvite(p.id)}
                        disabled={p.inviteStatus === 'joined' || p.inviteStatus === 'revoked'}
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => void deliverInvite(p.id)}
                        disabled={p.inviteStatus === 'joined' || p.inviteStatus === 'revoked'}
                      >
                        Deliver
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => void revokeInvite(p.id)}
                        disabled={p.inviteStatus === 'revoked'}
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="sessions-panel">
        <h3>Agenda</h3>
        <form className="sessions-form" onSubmit={addAgenda}>
          <div className="sessions-form__row">
            <div className="sessions-field">
              <label htmlFor="agenda-title">Item title</label>
              <input
                id="agenda-title"
                value={agendaTitle}
                onChange={(e) => setAgendaTitle(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn--primary">
              Table item
            </button>
          </div>
        </form>
        {detail.agenda.length === 0 ? (
          <div className="sessions-empty">
            <p className="sessions-empty__title">No agenda items</p>
            <p className="sessions-empty__body">Table an item to record a process label.</p>
          </div>
        ) : (
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
                        <button
                          key={st}
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => void markAgenda(item.id, st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="sessions-panel">
        <h3>Ledger</h3>
        {ledger.length === 0 ? (
          <div className="sessions-empty">
            <p className="sessions-empty__title">No process lines</p>
            <p className="sessions-empty__body">
              Process lines appear when the session opens, invites are created, or agenda items are
              marked. Room speech does not appear in the ledger.
            </p>
          </div>
        ) : (
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
                    <div className="sessions-actions">
                      <button type="button" className="btn btn--secondary" onClick={() => void publishLine(line.id)}>
                        Publish
                      </button>
                      <button type="button" className="btn btn--secondary" onClick={() => void withdrawLine(line.id)}>
                        Withdraw
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="sessions-panel">
        <h3>Joint minute</h3>
        <p className="sessions-page__subtitle">
          The joint minute is optional. It is separate from the live room and may be exported or
          wiped.
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
          <button type="button" className="btn btn--primary" onClick={() => void saveMinute()}>
            Save draft
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => void publishMinute()}>
            Publish
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => void exportMinute()}>
            Export markdown
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => void exportMinutePdf()}>
            Export PDF
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => void wipeMinute()}>
            Wipe minute
          </button>
        </div>
        {detail.minute && (
          <p className="sessions-page__subtitle">Minute status: {detail.minute.status}</p>
        )}
        {exportMd && (
          <pre className="sessions-code-once" style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
            {exportMd}
          </pre>
        )}
      </div>

      {s.status === 'purged' && (
        <div className="sessions-panel sessions-panel--receipt">
          <h3>Destruction receipt</h3>
          <p className="sessions-disclosure" role="note">
            Session records were destroyed. The destruction receipt remains.
          </p>
          {!receipt ? (
            <div className="sessions-empty">
              <p className="sessions-empty__title">Receipt not loaded</p>
              <p className="sessions-empty__body">Could not load destruction receipt.</p>
            </div>
          ) : (
            <>
            <dl className="receipt-dl">
              <dt>Purged at</dt>
              <dd>{new Date(receipt.purgedAt).toISOString()}</dd>
              <dt>Retention window</dt>
              <dd>{receipt.retentionWindow}</dd>
              <dt>Bodies destroyed</dt>
              <dd>{receipt.bodiesDestroyed.join(', ')}</dd>
              <dt>Final sequence</dt>
              <dd>{receipt.finalSequenceNumber}</dd>
              <dt>Ledger root hash</dt>
              <dd>
                <code>{receipt.ledgerRootHash}</code>
              </dd>
              <dt>Manifest digest</dt>
              <dd>
                <code>{receipt.destructionManifestDigest}</code>
              </dd>
              <dt>Verify</dt>
              <dd>{receiptValid == null ? '…' : receiptValid ? 'valid' : 'invalid'}</dd>
            </dl>
            <div className="sessions-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  const bytes = renderReceiptPdfBytes({
                    sessionId,
                    purgedAt: new Date(receipt.purgedAt).toISOString(),
                    retentionWindow: receipt.retentionWindow,
                    bodiesDestroyed: receipt.bodiesDestroyed,
                    finalSequenceNumber: receipt.finalSequenceNumber,
                    ledgerRootHash: receipt.ledgerRootHash,
                    destructionManifestDigest: receipt.destructionManifestDigest,
                    valid: receiptValid,
                  });
                  downloadPdfBytes(bytes, 'avelis-destruction-receipt.pdf');
                }}
              >
                Download receipt PDF
              </button>
            </div>
            </>
          )}
        </div>
      )}
      </div>
      <ProcessAgent
        sessionId={sessionId}
        disabled={s.status === 'purged'}
        copilot={copilot}
        busy={copilotBusy}
        onConsult={consultCopilot}
        onApply={applyCopilotAction}
      />
    </div>
  );
}
