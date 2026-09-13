import React, { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { SupabaseSignaling, SignalingMessage } from '../lib/supabaseSignaling';
import { WebRTCManager } from '../lib/webrtc';
import { generateSessionKey, exportKey, importKey, encryptMessage, decryptMessage } from '../lib/crypto';

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
  supabaseToken,
  identityClass,
  isHost,
  children,
}: {
  sessionId: string;
  partyId: string;
  supabaseToken: string;
  identityClass: string;
  isHost: boolean;
  children: ReactNode;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const identityClassRef = useRef<string>(identityClass);

  useEffect(() => {
    identityClassRef.current = identityClass;
  }, [identityClass]);

  useEffect(() => {
    let active = true;
    const signaling = new SupabaseSignaling(sessionId, partyId, isHost ? 'host' : 'guest', supabaseToken);
    const webrtc = new WebRTCManager(signaling);
    webrtcRef.current = webrtc;

    const setupHost = async () => {
      // Host generates the master session key
      cryptoKeyRef.current = await generateSessionKey();
    };

    if (isHost) {
      setupHost();
    }

    signaling.onMessage(async (msg: SignalingMessage) => {
      if (!active) return;
      
      try {
        switch (msg.type) {
          case 'join':
            if (isHost && msg.avelisRole === 'guest') {
              // A guest joined, initiate WebRTC offer
              await webrtc.createOffer(msg.partyId);
            }
            break;
          case 'offer':
            if (!isHost) {
              await webrtc.handleOffer(msg.sdp, msg.fromPartyId);
            }
            break;
          case 'answer':
            if (isHost) {
              await webrtc.handleAnswer(msg.sdp);
            }
            break;
          case 'ice-candidate':
            await webrtc.handleIceCandidate(msg.candidate);
            break;
        }
      } catch (e) {
        console.error('Signaling error', e);
      }
    });

    webrtc.onDataChannelOpen = async () => {
      if (isHost && cryptoKeyRef.current) {
        // We are host, Data channel opened, send the key to the guest
        const rawKey = await exportKey(cryptoKeyRef.current);
        const payload = JSON.stringify({ type: 'key-exchange' });
        
        // We need to send both the metadata and the raw key.
        // A simple protocol: send a JSON string for key exchange, then the binary key.
        // Actually, we can just send the key exchange as binary if we wanted, or we just send 
        // the ArrayBuffer and assume the first ArrayBuffer received by the guest is the key.
        webrtc.sendData(rawKey);
        setIsConnected(true);
      } else if (!isHost) {
        // Guest waits for key
      }
    };

    webrtc.onMessage = async (event) => {
      if (!active) return;
      
      const { data } = event;
      
      if (data instanceof ArrayBuffer) {
        if (!isHost && !cryptoKeyRef.current) {
          // This must be the key exchange
          try {
            const key = await importKey(data);
            cryptoKeyRef.current = key;
            setIsConnected(true);
          } catch (e) {
            console.error('Failed to import session key', e);
          }
        } else if (cryptoKeyRef.current) {
          // It's an encrypted chat message
          try {
            const decrypted = await decryptMessage(cryptoKeyRef.current, data);
            const parsed = JSON.parse(decrypted);
            
            if (parsed.type === 'chat') {
              setMessages((prev) => [
                ...prev,
                {
                  id: parsed.id,
                  senderClass: parsed.senderClass || 'Unknown',
                  text: parsed.text,
                  timestamp: parsed.timestamp,
                },
              ]);
            }
          } catch (e) {
            console.error('Failed to decrypt message', e);
          }
        }
      } else if (typeof data === 'string') {
        // We expect everything to be encrypted ArrayBuffers, but just in case
        console.warn('Received unencrypted string data', data);
      }
    };

    signaling.connect();

    return () => {
      active = false;
      signaling.disconnect();
      webrtc.close();
    };
  }, [sessionId, partyId, supabaseToken, isHost]);

  const sendMessage = async (text: string) => {
    if (webrtcRef.current && isConnected && cryptoKeyRef.current) {
      const msg = {
        type: 'chat',
        id: crypto.randomUUID(),
        senderClass: identityClassRef.current,
        text,
        timestamp: Date.now(),
      };
      
      const jsonStr = JSON.stringify(msg);
      
      try {
        const encrypted = await encryptMessage(cryptoKeyRef.current, jsonStr);
        webrtcRef.current.sendData(encrypted);
        
        // Optimistically add to our own UI
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            senderClass: msg.senderClass,
            text: msg.text,
            timestamp: msg.timestamp,
          },
        ]);
      } catch (e) {
        console.error('Failed to encrypt/send message', e);
      }
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
