/**
 * Pure in-memory room registry.
 * Product Law: Speech is memory-only. Rooms MUST NOT retain message history
 * after broadcast. Late joiners get no scrollback. Never log message bodies.
 */

/** Minimal socket surface so tests can mock without real `ws`. */
export interface WebSocketLike {
  readyState: number;
  OPEN: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export interface PartyMeta {
  partyId: string;
  identityClass: string;
}

export interface RoomState {
  sessionId: string;
  parties: Map<WebSocketLike, PartyMeta>;
  createdAt: number;
  // Intentionally NO messages / history buffer.
}

const rooms = new Map<string, RoomState>();

export function createRoom(sessionId: string): RoomState {
  const room: RoomState = {
    sessionId,
    parties: new Map(),
    createdAt: Date.now(),
  };
  rooms.set(sessionId, room);
  return room;
}

export function getRoom(sessionId: string): RoomState | undefined {
  return rooms.get(sessionId);
}

export function ensureRoom(sessionId: string): RoomState {
  const existing = rooms.get(sessionId);
  if (existing) return existing;
  return createRoom(sessionId);
}

export function hasRoom(sessionId: string): boolean {
  return rooms.has(sessionId);
}

export function activeRoomCount(): number {
  return rooms.size;
}

export function addParty(
  sessionId: string,
  socket: WebSocketLike,
  meta: PartyMeta
): RoomState {
  const room = ensureRoom(sessionId);
  room.parties.set(socket, meta);
  return room;
}

export function removeParty(sessionId: string, socket: WebSocketLike): void {
  const room = rooms.get(sessionId);
  if (!room) return;
  room.parties.delete(socket);
}

/**
 * Broadcast payload to all open sockets in the room.
 * Does NOT store the payload. Buffer is released after delivery (GC of local string).
 */
export function broadcast(sessionId: string, payload: unknown): number {
  const room = rooms.get(sessionId);
  if (!room) return 0;

  const serialized = JSON.stringify(payload);
  let delivered = 0;
  for (const [socket] of room.parties) {
    if (socket.readyState === socket.OPEN) {
      try {
        socket.send(serialized);
        delivered += 1;
      } catch {
        // Ignore send failures; do not log payload.
      }
    }
  }
  // serialized drops out of scope — no history retained on RoomState.
  return delivered;
}

/**
 * Close all sockets, clear party map, delete room entry.
 * @returns true if a room existed and was torn down.
 */
export function teardownRoom(sessionId: string): boolean {
  const room = rooms.get(sessionId);
  if (!room) return false;

  for (const [socket] of room.parties) {
    try {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: 'room_closed' }));
      }
      socket.close(1000, 'Session Closed');
    } catch {
      // Ignore close errors.
    }
  }
  room.parties.clear();
  rooms.delete(sessionId);
  return true;
}

/** Test-only: wipe all rooms (not used in production paths). */
export function _resetRoomsForTests(): void {
  rooms.clear();
}
