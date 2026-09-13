import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

// Tab memory only. Unmount / room_closed clears the live view. No scrollback after close.

interface Message {
  id: string;
  senderClass: string;
  text: string;
  timestamp: number;
  technique?: string | null;
  channel?: 'plenary' | 'caucus';
}

interface ProcessMove {
  technique: string;
  label: string;
}

interface Whisper {
  text: string;
  technique: string | null;
  confirm: 'open_caucus' | 'close_caucus' | 'table_label' | null;
}

interface Presence {
  partyId: string;
  identityClass: string;
}

interface CaucusView {
  open: boolean;
  youAreIn: boolean;
  members: Presence[];
}

interface RoomContextType {
  messages: Message[];
  whispers: Whisper[];
  processMove: ProcessMove | null;
  presence: Presence[];
  caucus: CaucusView;
  sendMessage: (text: string) => void;
  invokeAgent: (prompt?: string) => void;
  openCaucus: (partyId: string) => void;
  closeCaucus: (processFact?: string) => void;
  isConnected: boolean;
  isFacilitator: boolean;
  identityClass: string;
  partyId: string;
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
  const [processMove, setProcessMove] = useState<ProcessMove | null>(null);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [caucus, setCaucus] = useState<CaucusView>({ open: false, youAreIn: false, members: [] });
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
      setProcessMove(null);
      setPresence([]);
      setCaucus({ open: false, youAreIn: false, members: [] });
    };

    socket.onmessage = (event) => {
      let data: {
        type?: string;
        text?: string;
        technique?: string | null;
        label?: string | null;
        confirm?: Whisper['confirm'];
        channel?: 'plenary' | 'caucus';
        open?: boolean;
        youAreIn?: boolean;
        members?: Presence[];
        parties?: Presence[];
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
      if (data.type === 'presence' && Array.isArray(data.parties)) {
        setPresence(data.parties);
        return;
      }
      if (data.type === 'caucus_state') {
        setCaucus({
          open: Boolean(data.open),
          youAreIn: Boolean(data.youAreIn),
          members: Array.isArray(data.members) ? data.members : [],
        });
        if (!data.open) {
          setMessages((prev) => prev.filter((m) => m.channel !== 'caucus'));
        }
        return;
      }
      if (data.type === 'process_state' && typeof data.technique === 'string' && data.technique) {
        setProcessMove({
          technique: data.technique,
          label: typeof data.label === 'string' && data.label ? data.label : data.technique,
        });
        return;
      }
      if (data.type === 'agent_whisper' && typeof data.text === 'string') {
        setWhispers((prev) => [
          ...prev.slice(-7),
          {
            text: data.text!,
            technique: data.technique || null,
            confirm: data.confirm || null,
          },
        ]);
        return;
      }
      if (data.type === 'notice' && typeof data.text === 'string') {
        setMessages((prev) => [
          ...prev,
          {
            id: `notice-${Date.now()}`,
            senderClass: 'notice',
            text: data.text!,
            timestamp: Date.now(),
            channel: data.channel || 'plenary',
          },
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
            technique: msg.technique || null,
            channel: data.channel || msg.channel || 'plenary',
          },
        ]);
      } else if (data.type === 'room_closed') {
        setMessages([]);
        setWhispers([]);
        setProcessMove(null);
        socket.close();
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setMessages([]);
      setWhispers([]);
      setProcessMove(null);
      setPresence([]);
      setCaucus({ open: false, youAreIn: false, members: [] });
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

  const openCaucus = (memberId: string) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'caucus_open', partyId: memberId }));
    }
  };

  const closeCaucus = (processFact?: string) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'caucus_close', processFact: processFact || '' }));
    }
  };

  return (
    <RoomContext.Provider
      value={{
        messages,
        whispers,
        processMove,
        presence,
        caucus,
        sendMessage,
        invokeAgent,
        openCaucus,
        closeCaucus,
        isConnected,
        isFacilitator,
        identityClass,
        partyId,
      }}
    >
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
