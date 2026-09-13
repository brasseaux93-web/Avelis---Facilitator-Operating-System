import { createFileRoute, Link, useRouterState } from '@tanstack/react-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './sessions.css';
import { RoomProvider, useRoom } from '../room/RoomContext';
import { identityClassLabel } from '../lib/identityLabels';
import { TECHNIQUES, type TechniqueId } from '../lib/processCopilot/techniques';
import { ProtocolMark } from '../components/Logo';
import { ProcessClock } from '../components/ProcessClock';
import { setPartyViewToken } from './party';
import { apiPost } from '../lib/apiClient';
import { VoiceMesh } from '../room/VoiceMesh';

export const Route = createFileRoute('/room/$sessionId')({
  component: RoomPage,
});

type JoinState = {
  partyId?: string;
  roomToken?: string;
  identityClass?: string;
  partySessionToken?: string;
};

function RoomInner() {
  const { sessionId } = Route.useParams();
  const {
    messages,
    whispers,
    processMove,
    presence,
    caucus,
    clock,
    sendMessage,
    invokeAgent,
    openCaucus,
    closeCaucus,
    setClock,
    isConnected,
    roomEnded,
    isFacilitator,
    identityClass,
    partyId,
  } = useRoom();
  const [text, setText] = useState('');
  const [label, setLabel] = useState('');
  const [fact, setFact] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const inPrivateTurn = caucus.open && caucus.youAreIn;
  const plenaryPaused = caucus.open && !caucus.youAreIn;

  const feed = useMemo(() => {
    if (inPrivateTurn) {
      return messages.filter((m) => m.channel === 'caucus' || m.senderClass === 'notice');
    }
    return messages.filter((m) => m.channel !== 'caucus');
  }, [messages, inPrivateTurn]);

  const others = presence.filter((p) => p.identityClass !== 'facilitator' && p.partyId !== partyId);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isConnected, inPrivateTurn]);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || plenaryPaused) return;
    sendMessage(text.trim());
    setText('');
  };

  const recordCaucusLedger = async (action: 'open' | 'close') => {
    try {
      await apiPost('/api/sessions/' + sessionId + '/caucus', { action });
      if (action === 'close') {
        await apiPost('/api/sessions/' + sessionId + '/process-marks', { mark: 'return_to_plenary' });
      }
    } catch {
      // Room is the source of truth. Ledger stamp is best-effort.
    }
  };

  const tableLabel = async () => {
    const title = label.trim().slice(0, 80);
    if (!title) return;
    try {
      await apiPost('/api/sessions/' + sessionId + '/agenda', { title });
      setLabel('');
    } catch {
      // remain in the room
    }
  };

  const takeAside = async (id: string) => {
    openCaucus(id);
    await recordCaucusLedger('open');
  };

  const returnPlenary = async () => {
    closeCaucus(fact);
    setFact('');
    await recordCaucusLedger('close');
  };

  const moveLabel =
    processMove?.label ||
    (processMove?.technique && TECHNIQUES[processMove.technique as TechniqueId]?.label) ||
    null;

  const pageClass =
    'room-page room-page--conflict' +
    (inPrivateTurn ? ' room-page--caucus' : '') +
    (plenaryPaused ? ' room-page--paused' : '');

  return (
    <div className={pageClass}>
      <div className="room-page__main">
        <header className="room-chamber">
          <ProtocolMark className="room-chamber__mark" accent="currentColor" width="28" height="28" />
          <div>
            <p className="sessions-page__eyebrow">{inPrivateTurn ? 'Private turn' : 'Private room'}</p>
            <h1 className="sessions-page__title">
              {inPrivateTurn
                ? 'This talk stays here'
                : plenaryPaused
                  ? 'Plenary is paused'
                  : 'This conversation is not kept'}
            </h1>
          </div>
        </header>

        <div className="room-meta-bar" aria-live="polite">
          <span>
            <span
              className={`room-meta-bar__dot ${isConnected ? 'room-meta-bar__dot--live' : ''}`}
              aria-hidden="true"
            />
            {isConnected ? 'live' : 'disconnected'}
            {inPrivateTurn ? ' · caucus' : ''}
          </span>
          <span>You appear as {identityClassLabel(identityClass)}</span>
        </div>

        <p className="room-banner" role="note">
          Room messages are delivered live and are not stored by Avelis. Avelis is visible. If
          inference is on, a RAM window of this talk may be sent to the session’s provider while the
          room is open. Closing ends room access and destroys the live room. Messages cannot be
          recovered.
        </p>

        <ProcessClock
          endsAt={clock?.endsAt ?? null}
          minutes={clock?.minutes ?? null}
          elapsed={Boolean(clock?.elapsed)}
          isFacilitator={isFacilitator}
          onSet={setClock}
        />

        <VoiceMesh paused={plenaryPaused || inPrivateTurn} />

        {moveLabel && !plenaryPaused && (
          <p className="room-move" aria-live="polite">
            Current move · {moveLabel}
          </p>
        )}

        {isFacilitator && others.length > 0 && !caucus.open && (
          <div className="room-presence" aria-label="Take a private turn">
            <p className="room-line__meta">Take a private turn with</p>
            {others.map((p) => (
              <button
                key={p.partyId}
                type="button"
                className="room-chip"
                onClick={() => void takeAside(p.partyId)}
              >
                {identityClassLabel(p.identityClass)}
              </button>
            ))}
          </div>
        )}

        {isFacilitator && inPrivateTurn && (
          <form
            className="room-return"
            onSubmit={(e) => {
              e.preventDefault();
              void returnPlenary();
            }}
          >
            <label htmlFor="process-fact">Return a process fact, not a quote</label>
            <input
              id="process-fact"
              value={fact}
              onChange={(e) => setFact(e.target.value)}
              placeholder="One constraint a workable outcome has to satisfy"
              maxLength={80}
              autoComplete="off"
            />
            <button type="submit" className="btn btn--primary">
              Return to plenary
            </button>
          </form>
        )}

        <div className="room-feed" ref={feedRef} aria-live="polite" aria-label="Live room">
          {roomEnded ? (
            <div className="room-feed__empty">
              <p>This live room was destroyed.</p>
              <p>Messages cannot be recovered. The process record, if any, is on the session console until its destruction deadline.</p>
            </div>
          ) : plenaryPaused ? (
            <div className="room-feed__empty">
              <p>A private turn is underway.</p>
              <p>Plenary will resume. You will not hear that talk. You may hear a process fact.</p>
            </div>
          ) : feed.length === 0 ? (
            <div className="room-feed__empty">
              <p>Three facts, then the work.</p>
              <ol>
                <li>Avelis is in the room and you can see it.</li>
                <li>This talk is not stored.</li>
                <li>The facilitator writes the process record.</li>
              </ol>
            </div>
          ) : (
            feed.map((m) => (
              <div
                key={m.id}
                className={
                  'room-line' +
                  (m.senderClass === 'avelis' ? ' room-line--avelis' : '') +
                  (m.senderClass === 'notice' ? ' room-line--notice' : '')
                }
              >
                <div className="room-line__meta">
                  {m.senderClass === 'avelis'
                    ? `Avelis${m.technique && TECHNIQUES[m.technique as TechniqueId] ? ` · ${TECHNIQUES[m.technique as TechniqueId].label}` : ''}`
                    : m.senderClass === 'notice'
                      ? 'Process'
                      : identityClassLabel(m.senderClass)}
                </div>
                <div className="room-line__text">{m.text}</div>
              </div>
            ))
          )}
        </div>

        <form className="room-compose" onSubmit={onSend}>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              plenaryPaused
                ? 'Plenary is paused'
                : inPrivateTurn
                  ? 'Speak in the private turn'
                  : 'Speak to the room'
            }
            aria-label="Message"
            disabled={!isConnected || plenaryPaused}
            autoComplete="off"
          />
          <button type="submit" className="btn btn--primary" disabled={!isConnected || plenaryPaused}>
            Send
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              invokeAgent(text.trim() || undefined);
              setText('');
            }}
            disabled={!isConnected || plenaryPaused}
          >
            Ask Avelis
          </button>
        </form>
      </div>

      <aside className="room-agent" aria-label="Conflict agent">
        <p className="sessions-page__eyebrow">Avelis</p>
        <p className="room-agent__lede">
          {inPrivateTurn
            ? 'Visible in this private turn. Talk here does not become a quote in plenary.'
            : 'Visible conflict agent. Named mediation moves. Does not write the ledger. Not a lawyer.'}
        </p>
        {moveLabel && <p className="room-move room-move--rail">{moveLabel}</p>}
        {isFacilitator && whispers.length > 0 && (
          <div className="room-whispers">
            <p className="room-line__meta">Facilitator only</p>
            {whispers.map((w, i) => (
              <div key={i} className="room-whisper">
                {w.technique && TECHNIQUES[w.technique as TechniqueId] && (
                  <span className="room-line__meta">{TECHNIQUES[w.technique as TechniqueId].label}</span>
                )}
                <p>{w.text}</p>
                {w.confirm === 'open_caucus' && others[0] && !caucus.open && (
                  <button type="button" className="btn btn--secondary" onClick={() => void takeAside(others[0]!.partyId)}>
                    Take a private turn
                  </button>
                )}
                {w.confirm === 'close_caucus' && inPrivateTurn && (
                  <button type="button" className="btn btn--secondary" onClick={() => void returnPlenary()}>
                    Return to plenary
                  </button>
                )}
                {w.confirm === 'table_label' && (
                  <form
                    className="room-whisper__table"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void tableLabel();
                    }}
                  >
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Process label, not a quote"
                      maxLength={80}
                      aria-label="Process label"
                    />
                    <button type="submit" className="btn btn--secondary" disabled={!label.trim()}>
                      Table
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
        {!isFacilitator && (
          <p className="sessions-page__subtitle">
            Ask Avelis without putting the ask in the talk. The facilitator sees process notes you
            cannot see.
          </p>
        )}
      </aside>
    </div>
  );
}

function RoomPage() {
  const { sessionId } = Route.useParams();
  const routerState = useRouterState();
  const joinState = (routerState.location.state || {}) as JoinState;

  if (joinState.partySessionToken) {
    setPartyViewToken(joinState.partySessionToken);
  }

  if (!joinState.partyId || !joinState.roomToken) {
    return (
      <div className="room-page">
        <h1 className="sessions-page__title">Room</h1>
        <p className="sessions-error" role="alert">
          This room only opens from an invite redeem or a facilitator session console. There is no
          account to create.
        </p>
        <p className="sessions-page__subtitle">
          <Link to="/join">Join with an invite</Link>
        </p>
      </div>
    );
  }

  return (
    <RoomProvider
      sessionId={sessionId}
      partyId={joinState.partyId}
      roomToken={joinState.roomToken}
      identityClass={joinState.identityClass || 'unnamed'}
    >
      <RoomInner />
    </RoomProvider>
  );
}
