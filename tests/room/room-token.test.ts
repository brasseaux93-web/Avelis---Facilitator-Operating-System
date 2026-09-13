import { describe, expect, test } from 'vitest';
import {
  assertRoomProductionSecrets,
  expectedHmac,
  isValidRoomToken,
  ROOM_SECRET_PLACEHOLDERS,
} from '../../src/room/server';

describe('Room token auth (Macroscope P0)', () => {
  const secret = 'a-strong-room-shared-secret-for-tests-32b';
  const sessionId = '11111111-1111-1111-1111-111111111111';
  const partyId = '22222222-2222-2222-2222-222222222222';

  test('rejects raw ROOM_SHARED_SECRET as roomToken', () => {
    const env = { ROOM_SHARED_SECRET: secret };
    expect(isValidRoomToken(secret, sessionId, partyId, env)).toBe(false);
  });

  test('accepts HMAC(sessionId:partyId, secret)', () => {
    const env = { ROOM_SHARED_SECRET: secret };
    const token = expectedHmac(sessionId, partyId, secret);
    expect(isValidRoomToken(token, sessionId, partyId, env)).toBe(true);
  });

  test('production refuses compose placeholder secrets', () => {
    for (const ph of ROOM_SECRET_PLACEHOLDERS) {
      expect(() =>
        assertRoomProductionSecrets({
          NODE_ENV: 'production',
          ROOM_SHARED_SECRET: ph,
        })
      ).toThrow(/ROOM_SHARED_SECRET/);
    }
  });

  test('production accepts a strong secret', () => {
    expect(() =>
      assertRoomProductionSecrets({
        NODE_ENV: 'production',
        ROOM_SHARED_SECRET: secret,
      })
    ).not.toThrow();
  });
});
