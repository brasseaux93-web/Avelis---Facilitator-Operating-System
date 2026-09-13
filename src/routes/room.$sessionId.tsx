import { createFileRoute, useRouterState } from '@tanstack/react-router';
import React, { useState } from 'react';
import './sessions.css';
import { RoomProvider, useRoom } from '../room/RoomContext';

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
      <h1 className="sessions-page__title">Room</h1>
      <p className="sessions-disclosure" role="note">
        Room messages are delivered live and are not stored by Avelis.
      </p>
      <p className="sessions-page__subtitle">
        Connection: {isConnected ? 'connected' : 'disconnected'}
      </p>
      <div className="room-feed" aria-live="polite">
        {messages.length === 0 && (
          <p className="sessions-page__subtitle">No messages in this live view yet. Late joiners have no history.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="room-line">
            <div className="room-line__meta">{m.senderClass}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>
      <form className="room-compose" onSubmit={onSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          aria-label="Message"
          disabled={!isConnected}
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

  if (!joinState.partyId || !joinState.roomToken) {
    return (
      <div className="room-page">
        <h1 className="sessions-page__title">Room</h1>
        <p className="sessions-error" role="alert">
          Party credentials are missing. Redeem an invite code on the join page first.
        </p>
        <p className="sessions-page__subtitle">
          Room messages are delivered live and are not stored by Avelis.
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
