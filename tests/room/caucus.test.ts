import { beforeEach, describe, expect, test } from 'vitest';
import {
  addParty,
  getRoom,
  teardownRoom,
  _resetRoomsForTests,
  type WebSocketLike,
} from '../../src/room/memory';
import {
  closeCaucus,
  deliver,
  openCaucus,
  sanitizeProcessFact,
  _resetCaucusForTests,
} from '../../src/room/caucus';
import { forgetSession, openChamber, sessionWindow } from '../../src/room/conflictAgent';

function mockSocket(): WebSocketLike & { sent: string[] } {
  return {
    readyState: 1,
    OPEN: 1,
    sent: [] as string[],
    send(data: string) {
      this.sent.push(data);
    },
    close() {
      this.readyState = 3;
    },
  };
}

describe('RAM caucus', () => {
  beforeEach(() => {
    _resetRoomsForTests();
    _resetCaucusForTests();
    forgetSession('s1');
  });

  test('caucus talk does not reach plenary and is not stored on RoomState', () => {
    const fac = mockSocket();
    const a = mockSocket();
    const b = mockSocket();
    addParty('s1', fac, { partyId: 'f', identityClass: 'facilitator' });
    addParty('s1', a, { partyId: 'p1', identityClass: 'role_only' });
    addParty('s1', b, { partyId: 'p2', identityClass: 'named' });

    expect(openCaucus('s1', 'p1')).toBeTruthy();
    deliver('s1', 'caucus', { type: 'message', message: { text: 'only the private turn' } });

    const aPayloads = a.sent.map((s) => JSON.parse(s));
    const bPayloads = b.sent.map((s) => JSON.parse(s));
    expect(aPayloads.some((p) => p.message?.text === 'only the private turn')).toBe(true);
    expect(bPayloads.some((p) => p.message?.text === 'only the private turn')).toBe(false);
    expect(getRoom('s1')).not.toHaveProperty('messages');
    expect(getRoom('s1')).not.toHaveProperty('caucus');
  });

  test('process fact refuses a quote', () => {
    expect(sanitizeProcessFact('She said "never"')).toBe('A constraint was named');
    expect(sanitizeProcessFact('Coverage on nights')).toBe('Coverage on nights');
  });

  test('closing caucus drops membership; plenary can proceed', () => {
    const fac = mockSocket();
    const a = mockSocket();
    addParty('s1', fac, { partyId: 'f', identityClass: 'facilitator' });
    addParty('s1', a, { partyId: 'p1', identityClass: 'role_only' });
    openCaucus('s1', 'p1');
    closeCaucus('s1');
    a.sent.length = 0;
    deliver('s1', 'plenary', { type: 'notice', text: 'Private turn closed.' });
    expect(JSON.parse(a.sent[0]!).text).toMatch(/Private turn closed/);
  });

  test('opening ritual names the room once', () => {
    const a = mockSocket();
    addParty('s1', a, { partyId: 'p1', identityClass: 'role_only' });
    expect(openChamber('s1')).toBe(true);
    expect(openChamber('s1')).toBe(false);
    expect(sessionWindow('s1', 'plenary').some((t) => t.speaker === 'avelis')).toBe(true);
    teardownRoom('s1');
    expect(sessionWindow('s1', 'plenary')).toHaveLength(0);
  });
});
