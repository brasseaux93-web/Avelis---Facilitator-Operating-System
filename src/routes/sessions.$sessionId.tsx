import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import React, { useCallback, useEffect, useState, createElement as h } from 'react';
import './sessions.css';
import { useFacilitatorAuth } from '../lib/FacilitatorAuthContext';
import { apiGet, apiPatch, apiPost } from '../lib/apiClient';
export const Route = createFileRoute('/sessions/$sessionId')({ component: SessionConsolePage });
type AgendaItem = { id: string; title: string; status: string; sortOrder: number };
type Party = { id: string; identityClass: string; displayLabel: string; inviteStatus: string; deliveryAddress?: string | null };
type LedgerLine = { id: string; sequenceNumber: number; lineType: string; occurredAt: string; initialVisibility: string };
type SessionDetail = {
  session: { id: string; title: string; status: string; retentionHours: number; retentionExpiresAt: string | null; openedAt: string | null; closedAt: string | null; purgedAt?: string | null };
  parties: Party[];
  agenda: AgendaItem[];
  minute: { id: string; status: string; content: string | null } | null;
};
type DestructionReceipt = {
  id: string; purgedAt: string; retentionWindow: string; bodiesDestroyed: string[]; finalSequenceNumber: number;
  ledgerRootHash: string; destructionManifestDigest: string; attestedByKind: string; disclosure?: string;
};
function SessionConsolePage() {
  const { sessionId } = Route.useParams();
  const { isAuthenticated, token } = useFacilitatorAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null as SessionDetail | null);
  const [ledger, setLedger] = useState([] as LedgerLine[]);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState(null as string | null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLabel, setInviteLabel] = useState('Party');
  const [inviteClass, setInviteClass] = useState('role_only');
  const [deliverEmail, setDeliverEmail] = useState('');
  const [agendaTitle, setAgendaTitle] = useState('');
  const [minuteContent, setMinuteContent] = useState('');
  const [exportMd, setExportMd] = useState(null as string | null);
  const [receipt, setReceipt] = useState(null as DestructionReceipt | null);
  const [receiptValid, setReceiptValid] = useState(null as boolean | null);
  const [joinUrlHint, setJoinUrlHint] = useState('/join');
  useEffect(() => { if (!isAuthenticated) navigate({ to: '/auth' }); }, [isAuthenticated, navigate]);
  const refresh = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const d = await apiGet('/api/sessions/' + sessionId) as SessionDetail;
      setDetail(d);
      setMinuteContent(d.minute?.content || '');
      setLedger(await apiGet('/api/sessions/' + sessionId + '/ledger') as LedgerLine[]);
      if (d.session.status === 'purged') {
        try {
          setReceipt(await apiGet('/api/sessions/' + sessionId + '/destruction-receipt') as DestructionReceipt);
          const v = await apiGet('/api/sessions/' + sessionId + '/destruction-receipt/verify') as { valid: boolean };
          setReceiptValid(v.valid);
        } catch { setReceipt(null); setReceiptValid(null); }
      } else { setReceipt(null); setReceiptValid(null); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load session.'); }
  }, [sessionId, token]);
  useEffect(() => { if (isAuthenticated) void refresh(); }, [isAuthenticated, refresh]);
  const showCodeOnce = (code: string) => { setInviteCode(code); setInviteModalOpen(true); };
  const openSession = async () => { try { await apiPost('/api/sessions/' + sessionId + '/open'); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not open session.'); } };
  const closeSession = async () => { try { await apiPost('/api/sessions/' + sessionId + '/close'); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not close session.'); } };
  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault(); setInviteCode(null);
    try {
      const res = await apiPost('/api/sessions/' + sessionId + '/invites', { identityClass: inviteClass, displayLabel: inviteLabel }) as { inviteCode: string };
      showCodeOnce(res.inviteCode); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create invite.'); }
  };
  const resendInvite = async (partyId: string) => {
    try {
      const res = await apiPost('/api/sessions/' + sessionId + '/invites/' + partyId + '/resend') as { inviteCode: string };
      showCodeOnce(res.inviteCode); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not resend invite.'); }
  };
  const revokeInvite = async (partyId: string) => {
    try { await apiPost('/api/sessions/' + sessionId + '/invites/' + partyId + '/revoke'); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not revoke invite.'); }
  };
  const deliverInvite = async (partyId: string) => {
    try {
      const res = await apiPost('/api/sessions/' + sessionId + '/invites/' + partyId + '/deliver', { deliveryAddress: deliverEmail || undefined }) as { delivered: boolean; channel: string; inviteCode?: string; joinUrl?: string };
      if (res.joinUrl) setJoinUrlHint(res.joinUrl);
      if (!res.delivered && res.inviteCode) showCodeOnce(res.inviteCode);
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not deliver invite.'); }
  };
  const copyJoinLink = async (code?: string | null) => {
    const base = joinUrlHint.startsWith('http') ? joinUrlHint : (window.location.origin + (joinUrlHint.startsWith('/') ? joinUrlHint : '/' + joinUrlHint));
    try { await navigator.clipboard.writeText(code ? base + ' (code: ' + code + ')' : base); }
    catch { setError('Could not copy join link.'); }
  };
  const addAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await apiPost('/api/sessions/' + sessionId + '/agenda', { title: agendaTitle }); setAgendaTitle(''); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not create agenda item.'); }
  };
  const markAgenda = async (itemId: string, status: string) => {
    try { await apiPatch('/api/sessions/' + sessionId + '/agenda/' + itemId, { status }); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update agenda item.'); }
  };
  const saveMinute = async () => { try { await apiPost('/api/sessions/' + sessionId + '/minute', { content: minuteContent }); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update joint minute.'); } };
  const publishMinute = async () => { try { await apiPost('/api/sessions/' + sessionId + '/minute/publish'); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not publish joint minute.'); } };
  const wipeMinute = async () => { try { await apiPost('/api/sessions/' + sessionId + '/minute/wipe'); setMinuteContent(''); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not wipe joint minute.'); } };
  const exportMinute = async () => {
    try { const text = await apiGet('/api/sessions/' + sessionId + '/minute/export.md'); setExportMd(typeof text === 'string' ? text : String(text)); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not export joint minute.'); }
  };
  const publishLine = async (lineId: string) => { try { await apiPost('/api/sessions/' + sessionId + '/ledger/publish', { lineId }); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not publish ledger line.'); } };
  const withdrawLine = async (lineId: string) => { try { await apiPost('/api/sessions/' + sessionId + '/ledger/withdraw', { lineId }); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not withdraw ledger line.'); } };
  if (!isAuthenticated || !detail) {
    return h('div', { className: 'sessions-page' },
      h('p', { className: 'sessions-page__subtitle' }, error || 'Loading…'));
  }
  const s = detail.session;
  const btn = (label: string, onClick: () => void, primary?: boolean, disabled?: boolean) =>
    h('button', { type: 'button', className: primary ? 'btn btn--primary' : 'btn btn--secondary', onClick, disabled }, label);
  return h('div', { className: 'sessions-page' },
    h('p', { className: 'sessions-page__subtitle' }, h(Link, { to: '/sessions' }, '← Sessions')),
    h('div', { className: 'sessions-page__header' },
      h('div', null,
        h('h1', { className: 'sessions-page__title' }, s.title),
        h('p', { className: 'sessions-page__subtitle' }, 'Status ', h('span', { className: 'sessions-status' }, s.status), ' · Retain process records for ', s.retentionHours, 'h'))),
    h('p', { className: 'sessions-disclosure', role: 'note' },
      'Room messages are delivered live and are not stored by Avelis. Closing ends room access and destroys the live room. Messages cannot be recovered. The joint minute is optional. It is separate from the live room and may be exported or wiped.'),
    error ? h('p', { className: 'sessions-error', role: 'alert' }, error) : null,
    inviteModalOpen && inviteCode ? h('div', { className: 'sessions-panel', role: 'dialog', 'aria-labelledby': 'invite-code-title' },
      h('h3', { id: 'invite-code-title' }, 'One-time invite code'),
      h('p', { className: 'sessions-page__subtitle' }, 'Shown once — copy now. It will not be logged.'),
      h('div', { className: 'sessions-code-once' }, inviteCode),
      h('div', { className: 'sessions-actions' },
        btn('Copy link + code', function () { void copyJoinLink(inviteCode); }, true),
        btn('Clear', function () { setInviteModalOpen(false); setInviteCode(null); }))) : null,
    h('div', { className: 'sessions-panel' },
      h('h3', null, 'Session controls'),
      h('div', { className: 'sessions-actions' },
        btn('Open session', function () { void openSession(); }, true, s.status !== 'draft'),
        btn('Close session', function () { void closeSession(); }, false, s.status !== 'open')),
      h('p', { className: 'sessions-page__subtitle' }, 'Party join path: ', h('code', null, '/join'), ' (redeem invite code).')),
    h('div', { className: 'sessions-panel' },
      h('h3', null, 'Invites'),
      h('form', { className: 'sessions-form', onSubmit: createInvite },
        h('div', { className: 'sessions-form__row' },
          h('div', { className: 'sessions-field' },
            h('label', { htmlFor: 'invite-label' }, 'Display label'),
            h('input', { id: 'invite-label', value: inviteLabel, onChange: function (e) { setInviteLabel(e.target.value); }, required: true })),
          h('div', { className: 'sessions-field' },
            h('label', { htmlFor: 'invite-class' }, 'Identity class'),
            h('select', { id: 'invite-class', value: inviteClass, onChange: function (e) { setInviteClass(e.target.value); } },
              h('option', { value: 'named' }, 'named'),
              h('option', { value: 'role_only' }, 'role_only'),
              h('option', { value: 'affiliation_only' }, 'affiliation_only'),
              h('option', { value: 'unnamed' }, 'unnamed'))),
          h('button', { type: 'submit', className: 'btn btn--primary' }, 'Create invite')),
        h('div', { className: 'sessions-field' },
          h('label', { htmlFor: 'deliver-email' }, 'Delivery address (optional, for Deliver)'),
          h('input', { id: 'deliver-email', type: 'email', value: deliverEmail, onChange: function (e) { setDeliverEmail(e.target.value); }, placeholder: 'party@example.com', autoComplete: 'off' }))),
      detail.parties.length === 0
        ? h('div', { className: 'sessions-empty' },
            h('p', { className: 'sessions-empty__title' }, 'No parties yet'),
            h('p', { className: 'sessions-empty__body' }, 'Create an invite to issue a one-time code. Parties have no standing accounts.'))
        : h('table', { className: 'sessions-table' },
            h('thead', null, h('tr', null,
              h('th', null, 'Label'), h('th', null, 'Class'),
              h('th', null, 'Status'), h('th', null, 'Actions'))),
            h('tbody', null, detail.parties.map(function (p) {
              return h('tr', { key: p.id },
                h('td', null, p.displayLabel),
                h('td', null, p.identityClass),
                h('td', null, p.inviteStatus),
                h('td', null, h('div', { className: 'sessions-actions' },
                  btn('Copy link', function () { void copyJoinLink(inviteCode); }),
                  btn('Resend', function () { void resendInvite(p.id); }, false, p.inviteStatus === 'joined' || p.inviteStatus === 'revoked'),
                  btn('Deliver', function () { void deliverInvite(p.id); }, false, p.inviteStatus === 'joined' || p.inviteStatus === 'revoked'),
                  btn('Revoke', function () { void revokeInvite(p.id); }, false, p.inviteStatus === 'revoked'))));
            })))),
    h('div', { className: 'sessions-panel' },
      h('h3', null, 'Agenda'),
      h('form', { className: 'sessions-form', onSubmit: addAgenda },
        h('div', { className: 'sessions-form__row' },
          h('div', { className: 'sessions-field' },
            h('label', { htmlFor: 'agenda-title' }, 'Item title'),
            h('input', { id: 'agenda-title', value: agendaTitle, onChange: function (e) { setAgendaTitle(e.target.value); }, required: true })),
          h('button', { type: 'submit', className: 'btn btn--primary' }, 'Table item'))),
      detail.agenda.length === 0
        ? h('div', { className: 'sessions-empty' },
            h('p', { className: 'sessions-empty__title' }, 'No agenda items'),
            h('p', { className: 'sessions-empty__body' }, 'Table an item to record a process label.'))
        : h('table', { className: 'sessions-table' },
            h('thead', null, h('tr', null, h('th', null, 'Title'), h('th', null, 'Status'), h('th', null, 'Actions'))),
            h('tbody', null, detail.agenda.map(function (item) {
              return h('tr', { key: item.id },
                h('td', null, item.title),
                h('td', null, item.status),
                h('td', null, h('div', { className: 'sessions-actions' },
                  (['agreed', 'parked', 'refused', 'tabled'] as const).map(function (st) {
                    return btn(st, function () { void markAgenda(item.id, st); });
                  }))));
            })))),
    h('div', { className: 'sessions-panel' },
      h('h3', null, 'Ledger'),
      ledger.length === 0
        ? h('div', { className: 'sessions-empty' },
            h('p', { className: 'sessions-empty__title' }, 'No process lines'),
            h('p', { className: 'sessions-empty__body' }, 'Process lines appear when the session opens, invites are created, or agenda items are marked. Room speech does not appear in the ledger.'))
        : h('table', { className: 'sessions-table' },
            h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Type'), h('th', null, 'Visibility'), h('th', null, ''))),
            h('tbody', null, ledger.map(function (line) {
              return h('tr', { key: line.id },
                h('td', null, String(line.sequenceNumber)),
                h('td', null, line.lineType),
                h('td', null, line.initialVisibility),
                h('td', null, h('div', { className: 'sessions-actions' },
                  btn('Publish', function () { void publishLine(line.id); }),
                  btn('Withdraw', function () { void withdrawLine(line.id); }))));
            })))),
    h('div', { className: 'sessions-panel' },
      h('h3', null, 'Joint minute'),
      h('p', { className: 'sessions-page__subtitle' }, 'The joint minute is optional. It is separate from the live room and may be exported or wiped.'),
      h('div', { className: 'sessions-field' },
        h('label', { htmlFor: 'minute' }, 'Draft content'),
        h('textarea', { id: 'minute', rows: 8, value: minuteContent, onChange: function (e) { setMinuteContent(e.target.value); } })),
      h('div', { className: 'sessions-actions' },
        btn('Save draft', function () { void saveMinute(); }, true),
        btn('Publish', function () { void publishMinute(); }),
        btn('Export markdown', function () { void exportMinute(); }),
        btn('Wipe minute', function () { void wipeMinute(); })),
      detail.minute ? h('p', { className: 'sessions-page__subtitle' }, 'Minute status: ', detail.minute.status) : null,
      exportMd ? h('pre', { className: 'sessions-code-once', style: { whiteSpace: 'pre-wrap', fontSize: '0.85rem' } }, exportMd) : null),
    s.status === 'purged' ? h('div', { className: 'sessions-panel' },
      h('h3', null, 'Destruction receipt'),
      h('p', { className: 'sessions-disclosure', role: 'note' }, 'Session records were destroyed. The destruction receipt remains.'),
      !receipt
        ? h('div', { className: 'sessions-empty' },
            h('p', { className: 'sessions-empty__title' }, 'Receipt not loaded'),
            h('p', { className: 'sessions-empty__body' }, 'Could not load destruction receipt.'))
        : h('dl', { className: 'sessions-page__subtitle' },
            h('dt', null, 'Purged at'), h('dd', null, new Date(receipt.purgedAt).toISOString()),
            h('dt', null, 'Retention window'), h('dd', null, receipt.retentionWindow),
            h('dt', null, 'Bodies destroyed'), h('dd', null, receipt.bodiesDestroyed.join(', ')),
            h('dt', null, 'Final sequence'), h('dd', null, String(receipt.finalSequenceNumber)),
            h('dt', null, 'Ledger root hash'), h('dd', null, h('code', null, receipt.ledgerRootHash)),
            h('dt', null, 'Manifest digest'), h('dd', null, h('code', null, receipt.destructionManifestDigest)),
            h('dt', null, 'Verify'), h('dd', null, receiptValid == null ? '…' : receiptValid ? 'valid' : 'invalid'))) : null);
}
