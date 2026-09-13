import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

// Product Law L1: Messages MUST NOT touch durable storage on the client.
// Tab memory only. Unmount / room_closed clears the live view. No scrollback after close.

interface Message {
  id: string;
  senderClass: string;
  text: string;
  timestamp: number;
}

interface RoomContextType {
  messages: Message[];
  sendMessage: (text: string) => void;
  isConnected: boolean;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

function roomSocketUrl(params: URLSearchParams): string {
  const configured = import.meta.env.VITE_ROOM_WS_URL as string | undefined;
  const origin =
    configured ||
    `${typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
      typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    }:3002`;
  return `${origin.replace(/\/$/, '')}?${params.toString()}`;
}

export function RoomProvider({
  sessionId,
  partyId,
  roomToken,
  identityClass,
  children,
}: {
  sessionId: string;
  partyId: string;
  roomToken: string;
  identityClass: string;
  children: ReactNode;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      sessionId,
      partyId,
      roomToken,
      identityClass,
    });
    const socket = new WebSocket(roomSocketUrl(params));
    socketRef.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => {
      setIsConnected(false);
      setMessages([]);
    };

    socket.onmessage = (event) => {
      let data: { type?: string; message?: Message & { identityClass?: string } };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === 'history') {
        return;
      }
      if (data.type === 'message' && data.message) {
        const msg = data.message;
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            senderClass: msg.identityClass || msg.senderClass || 'party',
            text: msg.text,
            timestamp: msg.timestamp || Date.now(),
          },
        ]);
      } else if (data.type === 'room_closed') {
        setMessages([]);
        socket.close();
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setMessages([]);
    };
  }, [sessionId, partyId, roomToken, identityClass]);

  const sendMessage = (text: string) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'chat', text }));
    }
  };

  return (
    <RoomContext.Provider value={{ messages, sendMessage, isConnected }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
