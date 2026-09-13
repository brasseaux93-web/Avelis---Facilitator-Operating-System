import { createFileRoute, Link } from '@tanstack/react-router';
import React, { useCallback, useEffect, useState, createElement as h, Fragment } from 'react';
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

let memoryPartyToken: string | null = null;

export function setPartyViewToken(token: string | null) {
  memoryPartyToken = token;
}

function PartyViewPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState(memoryPartyToken as string | null);
  const [lines, setLines] = useState([] as LedgerLine[]);
  const [emptyLedger, setEmptyLedger] = useState(undefined as string | undefined);
  const [minute, setMinute] = useState(null as MinutePayload['minute']);
  const [emptyMinute, setEmptyMinute] = useState(undefined as string | undefined);
  const [sessionId, setSessionId] = useState(null as string | null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const refresh = useCallback(async function (partyToken: string) {
    setError('');
    try {
      const ledger = (await apiGet('/api/party/session/ledger', { token: partyToken })) as {
        sessionId: string;
        lines: LedgerLine[];
        emptyState?: string;
      };
      setLines(ledger.lines);
      setEmptyLedger(ledger.emptyState);
      setSessionId(ledger.sessionId);

      const m = (await apiGet('/api/party/session/minute', { token: partyToken })) as MinutePayload;
      setMinute(m.minute);
      setEmptyMinute(m.emptyState);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load party view.');
    }
  }, []);

  useEffect(function () {
    if (token) void refresh(token);
  }, [token, refresh]);

  function useToken(e: React.FormEvent) {
    e.preventDefault();
    const t = tokenInput.trim();
    if (!t) return;
    memoryPartyToken = t;
    setToken(t);
  }

  async function initialMinute() {
    if (!token || !sessionId || !minute) return;
    setInfo('');
    try {
      await apiPost('/api/sessions/' + sessionId + '/minute/initial', {}, { token: token });
      setInfo('Minute initial recorded.');
      await refresh(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record minute initial.');
    }
  }

  function onTokenChange(e: React.ChangeEvent) {
    setTokenInput((e.target as HTMLInputElement).value);
  }

  function renderLines() {
    return lines.map(function (line) {
      return h(
        'tr',
        { key: line.id },
        h('td', null, String(line.sequenceNumber)),
        h('td', null, line.lineType),
        h('td', null, new Date(line.occurredAt).toISOString())
      );
    });
  }

  return h(
    'div',
    { className: 'sessions-page' },
    h('p', { className: 'sessions-page__eyebrow' }, 'Party view'),
    h('h1', { className: 'sessions-page__title' }, 'Session process (party)'),
    h(
      'p',
      { className: 'sessions-disclosure', role: 'note' },
      'Room messages are delivered live and are not stored by Avelis. This view shows only process lines published to parties and any published joint minute.'
    ),
    !token
      ? h(
          'form',
          { className: 'sessions-form', onSubmit: useToken },
          h(
            'p',
            { className: 'sessions-page__subtitle' },
            'After redeeming an invite on ',
            h(Link, { to: '/join' }, '/join'),
            ', paste the party session token here (memory only for this tab). Prefer navigating from join when wired.'
          ),
          h(
            'div',
            { className: 'sessions-field' },
            h('label', { htmlFor: 'party-token' }, 'Party session token'),
            h('input', {
              id: 'party-token',
              value: tokenInput,
              onChange: onTokenChange,
              autoComplete: 'off',
              required: true,
            })
          ),
          h('button', { type: 'submit', className: 'btn btn--primary' }, 'Load party view')
        )
      : null,
    error ? h('p', { className: 'sessions-error', role: 'alert' }, error) : null,
    info ? h('p', { className: 'sessions-page__subtitle' }, info) : null,
    token
      ? h(
          Fragment,
          null,
          h(
            'div',
            { className: 'sessions-panel' },
            h('h3', null, 'Visible ledger'),
            lines.length === 0
              ? h(
                  'div',
                  { className: 'sessions-empty' },
                  h('p', { className: 'sessions-empty__title' }, 'No visible process lines'),
                  h(
                    'p',
                    { className: 'sessions-empty__body' },
                    emptyLedger || 'No process lines are visible to parties yet.'
                  )
                )
              : h(
                  'table',
                  { className: 'sessions-table' },
                  h(
                    'thead',
                    null,
                    h('tr', null, h('th', null, '#'), h('th', null, 'Type'), h('th', null, 'When'))
                  ),
                  h('tbody', null, renderLines())
                )
          ),
          h(
            'div',
            { className: 'sessions-panel' },
            h('h3', null, 'Joint minute'),
            !minute
              ? h(
                  'div',
                  { className: 'sessions-empty' },
                  h('p', { className: 'sessions-empty__title' }, 'No published minute'),
                  h(
                    'p',
                    { className: 'sessions-empty__body' },
                    emptyMinute || 'No joint minute is published for parties.'
                  )
                )
              : h(
                  Fragment,
                  null,
                  h(
                    'p',
                    { className: 'sessions-page__subtitle' },
                    'The joint minute is optional. It is separate from the live room and may be exported or wiped.'
                  ),
                  h(
                    'pre',
                    {
                      className: 'sessions-code-once',
                      style: { whiteSpace: 'pre-wrap', fontSize: '0.85rem' },
                    },
                    minute.content
                  ),
                  h(
                    'div',
                    { className: 'sessions-actions' },
                    h(
                      'button',
                      { type: 'button', className: 'btn btn--primary', onClick: initialMinute },
                      'Record initial'
                    )
                  )
                )
          )
        )
      : null
  );
}
