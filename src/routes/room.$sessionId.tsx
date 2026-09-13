import { createFileRoute, Link, useRouterState } from '@tanstack/react-router';
import React, { useState } from 'react';
import './sessions.css';
import { RoomProvider, useRoom } from '../components/RoomContext';

export const Route = createFileRoute('/room/$sessionId')({
  component: RoomPage,
});

type JoinState = {
  partyId?: string;
  roomToken?: string;
  supabaseToken?: string;
  identityClass?: string;
  partySessionToken?: string;
  isHost?: boolean;
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
      <p className="sessions-page__eyebrow">Live room</p>
      <h1 className="sessions-page__title">Room</h1>

      <div className="room-banner" role="note">
        Room messages are delivered live and are not stored by Avelis. Late joiners have no
        history. Closing ends room access and destroys the live room. Messages cannot be
        recovered.
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
      </div>

      <div className="room-feed" aria-live="polite" aria-label="Live room message stream">
        {messages.length === 0 ? (
          <p className="room-feed__empty">
            No messages in this live view yet. Late joiners have no history. Room messages are
            not stored by Avelis.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="room-line">
              <div className="room-line__meta">{m.senderClass}</div>
              <div className="room-line__text">{m.text}</div>
            </div>
          ))
        )}
      </div>

      <form className="room-compose" onSubmit={onSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Transmit message"
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

  if (!joinState.partyId || !joinState.supabaseToken) {
    return (
      <div className="room-page">
        <h1 className="sessions-page__title">Room</h1>
        <p className="sessions-error" role="alert">
          Party credentials or signaling token missing. Redeem an invite code on the join page first.
        </p>
        <p className="room-banner" role="note">
          Room messages are delivered live and are not stored by Avelis.
        </p>
        <p className="sessions-page__subtitle">
          <Link to="/join">Go to join</Link>
        </p>
      </div>
    );
  }

  return (
    <RoomProvider
      sessionId={sessionId}
      partyId={joinState.partyId}
      supabaseToken={joinState.supabaseToken}
      identityClass={joinState.identityClass || 'unnamed'}
      isHost={!!joinState.isHost}
    >
      <RoomInner />
    </RoomProvider>
  );
}
