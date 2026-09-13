import { createFileRoute, Link, useRouterState } from '@tanstack/react-router';
import React, { useEffect, useRef, useState } from 'react';
import './sessions.css';
import { RoomProvider, useRoom } from '../room/RoomContext';
import { identityClassLabel } from '../lib/identityLabels';
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
  const { messages, whispers, sendMessage, invokeAgent, isConnected, isFacilitator } = useRoom();
  const [text, setText] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  return (
    <div className="room-page room-page--conflict">
      <div className="room-page__main">
        <p className="sessions-page__eyebrow">Private room · conflict agent in session</p>
        <h1 className="sessions-page__title">This conversation is not kept</h1>

        <div className="room-banner" role="note">
          Avelis is in this room. What you type may be sent to the session’s inference provider while
          the room is open. Avelis does not store the talk. Late joiners have no history. Closing
          destroys the live room.
        </div>

        <div className="room-meta-bar" aria-live="polite">
          <span>
            <span
              className={`room-meta-bar__dot ${isConnected ? 'room-meta-bar__dot--live' : ''}`}
              aria-hidden="true"
            />
            {isConnected ? 'connected' : 'disconnected'}
          </span>
          <span>ephemeral stream · Avelis visible</span>
          <Link to="/party">Process view</Link>
        </div>

        <div className="room-feed" ref={feedRef} aria-live="polite" aria-label="Live room message stream">
          {messages.length === 0 ? (
            <p className="room-feed__empty">
              Speak when you are ready. Address Avelis with @avelis if you want the agent to speak
              to the room. Nothing here is stored after close.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={'room-line' + (m.senderClass === 'avelis' ? ' room-line--avelis' : '')}
              >
                <div className="room-line__meta">
                  {m.senderClass === 'avelis' ? 'Avelis · conflict agent' : identityClassLabel(m.senderClass)}
                </div>
                <div className="room-line__text">{m.text}</div>
              </div>
            ))
          )}
        </div>

        <form className="room-compose" onSubmit={onSend}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isFacilitator ? 'Speak to the room, or @avelis' : 'Speak to the room'}
            aria-label="Message"
            disabled={!isConnected}
            autoComplete="off"
          />
          <button type="submit" className="btn btn--primary" disabled={!isConnected}>
            Send
          </button>
        </form>
      </div>

      <aside className="room-agent" aria-label="Conflict agent">
        <p className="sessions-page__eyebrow">Avelis</p>
        <p className="room-agent__lede">
          Conflict agent. Not a lawyer. Does not write the ledger. Speaks to the room on a process
          cadence, or when asked.
        </p>
        {isFacilitator && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => invokeAgent()}
            disabled={!isConnected}
          >
            Ask Avelis to speak
          </button>
        )}
        {isFacilitator && whispers.length > 0 && (
          <div className="room-whispers">
            <p className="room-line__meta">Facilitator only</p>
            {whispers.map((w, i) => (
              <p key={i} className="room-whisper">
                {w}
              </p>
            ))}
          </div>
        )}
        {!isFacilitator && (
          <p className="sessions-page__subtitle">
            Type <code>@avelis</code> to ask the agent to address the room. The facilitator also
            sees private process notes you cannot see.
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
        <p className="room-banner" role="note">
          Room messages are delivered live and are not stored by Avelis. Avelis may be present as a
          visible conflict agent while the room is open.
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
