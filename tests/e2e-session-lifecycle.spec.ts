/**
 * Deterministic session lifecycle. Does not skip.
 * HMAC invites, opening ritual, RAM caucus isolation, process-fact return,
 * quote block, teardown, destruction receipt with ledgerRootHash.
 */
import { beforeEach, describe, expect, test } from 'vitest';
import crypto from 'node:crypto';
import { createRoomToken } from '../src/lib/auth';
import { expectedHmac, isValidRoomToken } from '../src/room/server';
import {
  addParty,
  getRoom,
  teardownRoom,
  _resetRoomsForTests,
  type WebSocketLike,
} from '../src/room/memory';
import {
  closeCaucus,
  deliver,
  openCaucus,
  sanitizeProcessFact,
  _resetCaucusForTests,
} from '../src/room/caucus';
import { forgetSession, openChamber, sessionWindow } from '../src/room/conflictAgent';
import { computePayloadDigest } from '../src/lib/ledger';
import { getKms, resetKmsForTests } from '../src/lib/encryption';
import { verifyDestructionReceipt } from '../src/server/destructionWorker';
import { securityHealthSnapshot } from '../src/lib/kms';

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

describe('E2E session lifecycle (non-skipping)', () => {
  beforeEach(() => {
    process.env.KMS_PROVIDER = 'local';
    process.env.LOCAL_DEV_SIGNING_KEY = 'local-dev-signing-key-not-for-production-use';
    process.env.ROOM_SHARED_SECRET = 'e2e-room-secret-32-bytes-minimum!!';
    process.env.JWT_SECRET = 'e2e-jwt-secret-32-bytes-minimum!!!!';
    resetKmsForTests();
    _resetRoomsForTests();
    _resetCaucusForTests();
  });

  test('authorized open → two HMAC invitees → ritual → caucus lockout → process fact → receipt', async () => {
    const sessionId = crypto.randomUUID();
    const facilitatorId = crypto.randomUUID();
    const partyA = crypto.randomUUID();
    const partyB = crypto.randomUUID();
    forgetSession(sessionId);

    const tokenA = createRoomToken(sessionId, partyA);
    const tokenB = createRoomToken(sessionId, partyB);
    const tokenF = createRoomToken(sessionId, facilitatorId);
    expect(tokenA).toBe(expectedHmac(sessionId, partyA, process.env.ROOM_SHARED_SECRET!));
    expect(isValidRoomToken(tokenA, sessionId, partyA)).toBe(true);
    expect(isValidRoomToken(tokenB, sessionId, partyB)).toBe(true);
    expect(isValidRoomToken(tokenF, sessionId, facilitatorId)).toBe(true);
    expect(isValidRoomToken(tokenA, sessionId, partyB)).toBe(false);

    const fac = mockSocket();
    const alpha = mockSocket();
    const beta = mockSocket();
    addParty(sessionId, fac, { partyId: facilitatorId, identityClass: 'facilitator' });
    addParty(sessionId, alpha, { partyId: partyA, identityClass: 'role_only' });
    expect(openChamber(sessionId)).toBe(true);
    addParty(sessionId, beta, { partyId: partyB, identityClass: 'named' });
    expect(openChamber(sessionId)).toBe(false);
    expect(sessionWindow(sessionId, 'plenary').some((t) => t.speaker === 'avelis')).toBe(true);

    expect(openCaucus(sessionId, partyA)).toBeTruthy();
    alpha.sent.length = 0;
    beta.sent.length = 0;
    fac.sent.length = 0;
    const privateTalk = 'only alpha may hear this coverage constraint';
    deliver(sessionId, 'caucus', { type: 'message', message: { text: privateTalk } });

    const alphaTexts = alpha.sent.join('\n');
    const betaTexts = beta.sent.join('\n');
    expect(alphaTexts).toContain(privateTalk);
    expect(betaTexts).not.toContain(privateTalk);
    expect(beta.sent.some((s) => s.includes('"text"') && s.includes(privateTalk))).toBe(false);
    expect(getRoom(sessionId)).not.toHaveProperty('messages');

    expect(sanitizeProcessFact('She said "never nights"')).toBe('A constraint was named');
    const fact = sanitizeProcessFact('Coverage on nights');
    expect(fact).toBe('Coverage on nights');
    closeCaucus(sessionId);
    beta.sent.length = 0;
    deliver(sessionId, 'plenary', {
      type: 'notice',
      text: `Private turn closed. Process fact: ${fact}.`,
    });
    expect(beta.sent.join('\n')).toContain('Coverage on nights');
    expect(beta.sent.join('\n')).not.toContain('She said');
    expect(beta.sent.join('\n')).not.toContain(privateTalk);

    teardownRoom(sessionId);
    expect(getRoom(sessionId)).toBeUndefined();

    const organizationId = crypto.randomUUID();
    const purgedAt = new Date().toISOString();
    const ledgerRootHash = crypto.createHash('sha256').update(sessionId).digest('hex');
    const manifest = {
      sessionId,
      organizationId,
      purgedAt,
      retentionWindow: '0h',
      bodiesDestroyed: ['ledger_lines', 'joint_minutes', 'agenda_items', 'parties', 'session_content'],
      finalSequenceNumber: 8,
      ledgerRootHash,
    };
    const destructionManifestDigest = computePayloadDigest(manifest);
    const signature = (
      await getKms().sign(
        process.env.LOCAL_DEV_SIGNING_KEY!,
        Buffer.from(destructionManifestDigest, 'hex')
      )
    ).toString('hex');
    await expect(
      verifyDestructionReceipt({
        ...manifest,
        destructionManifestDigest,
        signature,
      })
    ).resolves.toBe(true);
    expect(ledgerRootHash).toMatch(/^[a-f0-9]{64}$/);

    const health = securityHealthSnapshot();
    expect(health.room.persistedSpeech).toBe(false);
    expect(health.subprocessors.speechStored).toBe(false);
  });
});
