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
  const wss = new WebSocketServer({ port, maxPayload: MESSAGE_MAX_BYTES });

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
    // Ensure OPEN constant is present for WebSocketLike consumers.
    (socket as WebSocketLike).OPEN = WebSocket.OPEN;

    ensureRoom(sessionId);
    addParty(sessionId, socket, { partyId, identityClass });
    // No history replay — late joiners get no scrollback.

    ws.on('message', (data) => {
      let parsed: { type?: string; text?: string };
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        // Parse errors: ignore without logging payload.
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

      // Broadcast only — never store, never console.log text.
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

// package.json runs `tsx watch src/room/server.ts` — start on import for that entry.
// Tests should import from ./memory only (avoid binding the port under Vitest).
if (process.env.VITEST !== 'true') {
  createRoomServer(PORT);
  console.log(`Memory-only Ephemeral Room Service listening on ws://localhost:${PORT}`);
}
