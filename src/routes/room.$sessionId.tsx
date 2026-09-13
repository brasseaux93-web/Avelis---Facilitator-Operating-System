import { createFileRoute, Link, useRouterState } from '@tanstack/react-router';
import React, { useEffect, useRef, useState } from 'react';
import './sessions.css';
import { RoomProvider, useRoom } from '../room/RoomContext';
import { identityClassLabel } from '../lib/identityLabels';
import { TECHNIQUES, type TechniqueId } from '../lib/processCopilot/techniques';
import { ProtocolMark } from '../components/Logo';
import { setPartyViewToken } from './party';

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
  const {
    messages,
    whispers,
    processMove,
    sendMessage,
    invokeAgent,
    isConnected,
    isFacilitator,
    identityClass,
  } = useRoom();
  const [text, setText] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isConnected]);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  const moveLabel =
    processMove?.label ||
    (processMove?.technique && TECHNIQUES[processMove.technique as TechniqueId]?.label) ||
    null;

  return (
    <div className="room-page room-page--conflict">
      <div className="room-page__main">
        <header className="room-chamber">
          <ProtocolMark className="room-chamber__mark" accent="currentColor" width="28" height="28" />
          <div>
            <p className="sessions-page__eyebrow">Private room</p>
            <h1 className="sessions-page__title">This conversation is not kept</h1>
          </div>
        </header>

        <div className="room-meta-bar" aria-live="polite">
          <span>
            <span
              className={`room-meta-bar__dot ${isConnected ? 'room-meta-bar__dot--live' : ''}`}
              aria-hidden="true"
            />
            {isConnected ? 'live' : 'disconnected'}
          </span>
          <span>You appear as {identityClassLabel(identityClass)}</span>
          {isFacilitator && <Link to="/party">Process view</Link>}
        </div>

        {moveLabel && (
          <p className="room-move" aria-live="polite">
            Current move · {moveLabel}
          </p>
        )}

        <div className="room-feed" ref={feedRef} aria-live="polite" aria-label="Live room">
          {messages.length === 0 ? (
            <div className="room-feed__empty">
              <p>Three facts, then the work.</p>
              <ol>
                <li>Avelis is in the room and you can see it.</li>
                <li>This talk is not stored.</li>
                <li>The facilitator writes the process record.</li>
              </ol>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={'room-line' + (m.senderClass === 'avelis' ? ' room-line--avelis' : '')}
              >
                <div className="room-line__meta">
                  {m.senderClass === 'avelis'
                    ? `Avelis${m.technique && TECHNIQUES[m.technique as TechniqueId] ? ` · ${TECHNIQUES[m.technique as TechniqueId].label}` : ''}`
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
            placeholder={isFacilitator ? 'Speak to the room' : 'Speak to the room'}
            aria-label="Message"
            disabled={!isConnected}
            autoComplete="off"
          />
          <button type="submit" className="btn btn--primary" disabled={!isConnected}>
            Send
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              invokeAgent(text.trim() || undefined);
              setText('');
            }}
            disabled={!isConnected}
          >
            Ask Avelis
          </button>
        </form>
      </div>

      <aside className="room-agent" aria-label="Conflict agent">
        <p className="sessions-page__eyebrow">Avelis</p>
        <p className="room-agent__lede">
          Visible conflict agent. Named mediation moves. Does not write the ledger. Not a lawyer.
        </p>
        {moveLabel && <p className="room-move room-move--rail">{moveLabel}</p>}
        {isFacilitator && whispers.length > 0 && (
          <div className="room-whispers">
            <p className="room-line__meta">Facilitator only</p>
            {whispers.map((w, i) => (
              <p key={i} className="room-whisper">
                {w.technique && TECHNIQUES[w.technique as TechniqueId] && (
                  <span className="room-line__meta">{TECHNIQUES[w.technique as TechniqueId].label}</span>
                )}
                {w.text}
              </p>
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
