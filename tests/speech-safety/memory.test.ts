import { expect, test, describe, beforeEach } from 'vitest';
import {
  createRoom,
  getRoom,
  ensureRoom,
  addParty,
  removeParty,
  broadcast,
  teardownRoom,
  hasRoom,
  activeRoomCount,
  _resetRoomsForTests,
  type WebSocketLike,
} from '../../src/room/memory';

function mockSocket(): WebSocketLike & { sent: string[]; closed: boolean } {
  const sock = {
    readyState: 1,
    OPEN: 1,
    sent: [] as string[],
    closed: false,
    send(data: string) {
      this.sent.push(data);
    },
    close(_code?: number, _reason?: string) {
      this.closed = true;
      this.readyState = 3;
    },
  };
  return sock;
}

describe('Speech Safety - Ephemeral Room (memory.ts)', () => {
  beforeEach(() => {
    _resetRoomsForTests();
  });

  test('broadcast does not retain messages (no messages array on room state)', () => {
    const sessionId = 'sess-broadcast';
    const a = mockSocket();
    const b = mockSocket();
    addParty(sessionId, a, { partyId: 'p1', identityClass: 'named' });
    addParty(sessionId, b, { partyId: 'p2', identityClass: 'role_only' });

    broadcast(sessionId, { type: 'message', message: { text: 'ephemeral-only' } });

    const room = getRoom(sessionId);
    expect(room).toBeDefined();
    // Architecture §4: deliver and drop — RoomState must not keep history.
    expect(room).not.toHaveProperty('messages');
    expect(Object.keys(room as object).sort()).toEqual(
      ['createdAt', 'parties', 'sessionId'].sort()
    );
    expect(a.sent).toHaveLength(1);
    expect(b.sent).toHaveLength(1);
    expect(JSON.parse(a.sent[0]!).message.text).toBe('ephemeral-only');
  });

  test('multiple parties receive broadcast via mock sockets', () => {
    const sessionId = 'sess-multi';
    const sockets = [mockSocket(), mockSocket(), mockSocket()];
    sockets.forEach((s, i) =>
      addParty(sessionId, s, { partyId: `p${i}`, identityClass: 'unnamed' })
    );

    const delivered = broadcast(sessionId, { type: 'message', message: { text: 'hello' } });
    expect(delivered).toBe(3);
    for (const s of sockets) {
      expect(s.sent).toHaveLength(1);
      expect(JSON.parse(s.sent[0]!).type).toBe('message');
    }
  });

  test('teardownRoom removes room, clears parties, closes sockets', () => {
    const sessionId = 'sess-teardown';
    const a = mockSocket();
    const b = mockSocket();
    ensureRoom(sessionId);
    addParty(sessionId, a, { partyId: 'a', identityClass: 'named' });
    addParty(sessionId, b, { partyId: 'b', identityClass: 'named' });
    expect(hasRoom(sessionId)).toBe(true);
    expect(activeRoomCount()).toBe(1);

    const existed = teardownRoom(sessionId);
    expect(existed).toBe(true);
    expect(hasRoom(sessionId)).toBe(false);
    expect(getRoom(sessionId)).toBeUndefined();
    expect(activeRoomCount()).toBe(0);
    expect(a.closed).toBe(true);
    expect(b.closed).toBe(true);
  });

  test('after teardown hasRoom is false; second teardown returns false', () => {
    const sessionId = 'sess-gone';
    createRoom(sessionId);
    expect(teardownRoom(sessionId)).toBe(true);
    expect(hasRoom(sessionId)).toBe(false);
    expect(teardownRoom(sessionId)).toBe(false);
  });

  test('removeParty drops a socket without destroying the room', () => {
    const sessionId = 'sess-remove';
    const a = mockSocket();
    const b = mockSocket();
    addParty(sessionId, a, { partyId: 'a', identityClass: 'named' });
    addParty(sessionId, b, { partyId: 'b', identityClass: 'named' });
    removeParty(sessionId, a);
    const room = getRoom(sessionId)!;
    expect(room.parties.size).toBe(1);
    expect(room.parties.has(b)).toBe(true);
  });
});
