import { describe, expect, test, beforeEach } from 'vitest';
import { askedForAvelis, forgetSession, parseAgentJson, rememberTurn, sessionWindow } from '../../src/room/conflictAgent';
import { teardownRoom, _resetRoomsForTests, addParty, type WebSocketLike } from '../../src/room/memory';

function mockSocket(): WebSocketLike {
  return {
    readyState: 1,
    OPEN: 1,
    send() {},
    close() {},
  };
}

describe('live-room conflict agent', () => {
  beforeEach(() => {
    _resetRoomsForTests();
    forgetSession('s1');
  });

  test('rolling window stays off RoomState and dies on teardown', () => {
    addParty('s1', mockSocket(), { partyId: 'p1', identityClass: 'role_only' });
    rememberTurn('s1', { speaker: 'party', identityClass: 'role_only', text: 'we need hours' });
    expect(sessionWindow('s1')).toHaveLength(1);
    teardownRoom('s1');
    expect(sessionWindow('s1')).toHaveLength(0);
  });

  test('@avelis detection', () => {
    expect(askedForAvelis('hello')).toBe(false);
    expect(askedForAvelis('@avelis what is the problem')).toBe(true);
    expect(askedForAvelis('Avelis, name the issue')).toBe(true);
  });

  test('parseAgentJson fail closed', () => {
    const parsed = parseAgentJson('{"whisper":"Park the blocker.","speak":"Shall we park this item?"}');
    expect(parsed.whisper).toMatch(/Park/);
    expect(parsed.speak).toMatch(/park/i);
    expect(parseAgentJson('not json').speak).toBeNull();
  });
});
