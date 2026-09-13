import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Product Law L1: Messages MUST NOT touch durable storage on the client.
// This context stores everything in memory only. It deliberately avoids localStorage,
// sessionStorage, indexedDB, or caching layers. No history dependency.

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
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({
      sessionId,
      partyId,
      roomToken,
      identityClass,
    });
    const socket = new WebSocket(`ws://localhost:3002?${params.toString()}`);

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Ignore history payloads if a server ever sends them — late joiners get no scrollback.
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

    setWs(socket);

    return () => {
      socket.close();
      setMessages([]);
    };
  }, [sessionId, partyId, roomToken, identityClass]);

  const sendMessage = (text: string) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({ type: 'chat', text }));
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
