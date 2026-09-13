import { createFileRoute, Link, useRouterState } from '@tanstack/react-router';
import React, { useState } from 'react';
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
  const { messages, sendMessage, isConnected } = useRoom();
  const [text, setText] = useState('');

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  return (
    <div className="room-page">
      <p className="sessions-page__eyebrow">Live room · temporal</p>
      <h1 className="sessions-page__title">This conversation is not kept</h1>

      <div className="room-banner" role="note">
        Room messages are delivered live and are not stored by Avelis. Late joiners have no
        history. Closing ends room access and destroys the live room. Messages cannot be recovered.
      </div>

      <div className="room-meta-bar" aria-live="polite">
        <span>
          <span
            className={`room-meta-bar__dot ${isConnected ? 'room-meta-bar__dot--live' : ''}`}
            aria-hidden="true"
          />
          {isConnected ? 'connected' : 'disconnected'}
        </span>
        <span>ephemeral stream · no scrollback after close</span>
        <Link to="/party">Process view</Link>
      </div>

      <div className="room-feed" aria-live="polite" aria-label="Live room message stream">
        {messages.length === 0 ? (
          <p className="room-feed__empty">
            No messages in this live view yet. Late joiners have no history. Room messages are not
            stored by Avelis.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="room-line">
              <div className="room-line__meta">{identityClassLabel(m.senderClass)}</div>
              <div className="room-line__text">{m.text}</div>
            </div>
          ))
        )}
      </div>

      <form className="room-compose" onSubmit={onSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Speak to the room"
          aria-label="Message"
          disabled={!isConnected}
          autoComplete="off"
        />
        <button type="submit" className="btn btn--primary" disabled={!isConnected}>
          Send
        </button>
      </form>
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
          Room messages are delivered live and are not stored by Avelis.
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
