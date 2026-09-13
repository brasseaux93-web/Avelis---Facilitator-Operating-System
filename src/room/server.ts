/**
 * Ephemeral WebSocket room server.
 * All room state lives in memory.ts. This file only wires ws + auth.
 *
 * Auth (document):
 * - Require query params: sessionId, partyId, roomToken.
 * - Accept roomToken if it equals process.env.ROOM_SHARED_SECRET (shared secret),
 *   OR if it equals HMAC-SHA256(sessionId + ":" + partyId, ROOM_SHARED_SECRET) hex.
 * Reject with close code 1008 when missing/invalid.
 *
 * Never log room message bodies. Late joiners get no scrollback.
 *
 * Isolation:
 * - ROOM_SWAP_DISABLED=true documents host intent to disable swap for this process.
 * - Production refuses to start if ROOM_SHARED_SECRET is missing or the default placeholder.
 */
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'node:crypto';
import {
  addParty,
  removeParty,
  broadcast,
  teardownRoom,
  ensureRoom,
  type WebSocketLike,
} from './memory';

export {
  teardownRoom,
  ensureRoom,
  hasRoom,
  activeRoomCount,
  broadcast,
  addParty,
  removeParty,
  createRoom,
  getRoom,
} from './memory';

const PORT = Number(process.env.ROOM_PORT || 3002);
const MESSAGE_MAX_BYTES = Number(process.env.ROOM_MESSAGE_MAX_BYTES || 8192);
const DEFAULT_ROOM_SECRET = 'change-me-room-secret';

function assertRoomProductionSecrets(): void {
  if (process.env.ROOM_SWAP_DISABLED === 'true') {
    console.log(
      JSON.stringify({
        level: 'info',
        event: 'room_swap_disabled_documented',
        note: 'Host should disable swap for the room process (mem_limit / cgroup).',
        ts: new Date().toISOString(),
      })
    );
  }

  if (process.env.NODE_ENV !== 'production') return;

  const secret = process.env.ROOM_SHARED_SECRET;
  if (!secret || secret === DEFAULT_ROOM_SECRET || secret === 'change-me') {
    throw new Error(
      'Room server refused to start in production: ROOM_SHARED_SECRET missing or default. Set a strong secret.'
    );
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function expectedHmac(sessionId: string, partyId: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${sessionId}:${partyId}`)
    .digest('hex');
}

function isValidRoomToken(
  roomToken: string,
  sessionId: string,
  partyId: string
): boolean {
  const secret = process.env.ROOM_SHARED_SECRET;
  if (!secret) return false;
  if (timingSafeEqualHex(roomToken, secret)) return true;
  const hmac = expectedHmac(sessionId, partyId, secret);
  return timingSafeEqualHex(roomToken, hmac);
}

export function createRoomServer(port = PORT): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const sessionId = url.searchParams.get('sessionId');
    const partyId = url.searchParams.get('partyId');
    const roomToken = url.searchParams.get('roomToken');
    const identityClass = url.searchParams.get('identityClass') || 'unnamed';

    if (!sessionId || !partyId || !roomToken) {
      ws.close(1008, 'sessionId, partyId, and roomToken required');
      return;
    }

    if (!isValidRoomToken(roomToken, sessionId, partyId)) {
      ws.close(1008, 'Invalid roomToken');
      return;
    }

    const socket = ws as unknown as WebSocketLike;
    (socket as WebSocketLike).OPEN = WebSocket.OPEN;

    ensureRoom(sessionId);
    addParty(sessionId, socket, { partyId, identityClass });

    ws.on('message', (data) => {
      let parsed: { type?: string; text?: string };
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return;
      }

      if (parsed?.type !== 'chat' || typeof parsed.text !== 'string') {
        return;
      }

      const text = parsed.text;
      const byteLen = Buffer.byteLength(text, 'utf8');
      if (byteLen > MESSAGE_MAX_BYTES) {
        try {
          ws.close(1009, 'Message too large');
        } catch {
          // ignore
        }
        return;
      }

      broadcast(sessionId, {
        type: 'message',
        message: {
          id: crypto.randomUUID(),
          partyId,
          identityClass,
          text,
          timestamp: Date.now(),
        },
      });
    });

    ws.on('close', () => {
      removeParty(sessionId, socket);
    });
  });

  return wss;
}

if (process.env.VITEST !== 'true') {
  assertRoomProductionSecrets();
  createRoomServer(PORT);
  console.log(
    JSON.stringify({
      level: 'info',
      event: 'room_listen',
      port: PORT,
      ts: new Date().toISOString(),
    })
  );
}
