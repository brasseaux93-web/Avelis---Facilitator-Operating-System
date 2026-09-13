import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Product Law L1: Messages MUST NOT touch durable storage on the client.
// This context stores everything in memory only. It deliberately avoids localStorage,
// sessionStorage, indexedDB, or caching layers.

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

export function RoomProvider({ sessionId, partyClass, children }: { sessionId: string; partyClass: string; children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the memory-only WebSocket server
    const socket = new WebSocket(`ws://localhost:3002?sessionId=${sessionId}&partyClass=${partyClass}`);

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        setMessages(data.messages);
      } else if (data.type === 'message') {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === 'room_closed') {
        // Purge immediately from React state
        setMessages([]);
        socket.close();
      }
    };

    setWs(socket);

    return () => {
      socket.close();
      // On component unmount, force memory destruction
      setMessages([]);
    };
  }, [sessionId, partyClass]);

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
