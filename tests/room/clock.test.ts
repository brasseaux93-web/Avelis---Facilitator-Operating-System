import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { addParty, getRoom, teardownRoom, _resetRoomsForTests, type WebSocketLike } from '../../src/room/memory';
import { clearClock, getClock, setClock, _resetClockForTests } from '../../src/room/clock';

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

describe('process clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetRoomsForTests();
    _resetClockForTests();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('is not stored on RoomState and does not auto-close', () => {
    const a = mockSocket();
    addParty('s1', a, { partyId: 'p1', identityClass: 'role_only' });
    expect(setClock('s1', 25)).toBeTruthy();
    expect(getClock('s1')?.minutes).toBe(25);
    expect(getClock('s1')?.elapsed).toBe(false);
    expect(getRoom('s1')).not.toHaveProperty('messages');
    expect(getRoom('s1')).not.toHaveProperty('clock');
    vi.advanceTimersByTime(25 * 60_000 + 10);
    expect(getClock('s1')?.elapsed).toBe(true);
    expect(getRoom('s1')).toBeDefined();
    const notice = a.sent.map((s) => JSON.parse(s)).find((p) => p.type === 'notice');
    expect(notice?.text).toMatch(/does not close itself/);
  });

  test('rejects out of range and teardown forgets', () => {
    addParty('s1', mockSocket(), { partyId: 'p1', identityClass: 'named' });
    expect(setClock('s1', 2)).toBeNull();
    expect(setClock('s1', 25)).toBeTruthy();
    clearClock('s1');
    expect(getClock('s1')).toBeUndefined();
    setClock('s1', 50);
    teardownRoom('s1');
    expect(getClock('s1')).toBeUndefined();
  });
});
