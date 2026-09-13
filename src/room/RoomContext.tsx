import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

// Tab memory only. Unmount / room_closed clears the live view. No scrollback after close.

interface Message {
  id: string;
  senderClass: string;
  text: string;
  timestamp: number;
}

interface Whisper {
  text: string;
  technique: string | null;
}

interface RoomContextType {
  messages: Message[];
  whispers: Whisper[];
  sendMessage: (text: string) => void;
  invokeAgent: (prompt?: string) => void;
  isConnected: boolean;
  isFacilitator: boolean;
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
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const isFacilitator = identityClass === 'facilitator';

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
      setWhispers([]);
    };

    socket.onmessage = (event) => {
      let data: {
        type?: string;
        text?: string;
        technique?: string | null;
        message?: Message & { identityClass?: string; technique?: string };
      };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === 'history') {
        return;
      }
      if (data.type === 'agent_whisper' && typeof data.text === 'string') {
        setWhispers((prev) => [
          ...prev.slice(-7),
          { text: data.text!, technique: data.technique || null },
        ]);
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
        setWhispers([]);
        socket.close();
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setMessages([]);
      setWhispers([]);
    };
  }, [sessionId, partyId, roomToken, identityClass]);

  const sendMessage = (text: string) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'chat', text }));
    }
  };

  const invokeAgent = (prompt?: string) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'agent_invoke', prompt: prompt || '' }));
    }
  };

  return (
    <RoomContext.Provider value={{ messages, whispers, sendMessage, invokeAgent, isConnected, isFacilitator }}>
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
