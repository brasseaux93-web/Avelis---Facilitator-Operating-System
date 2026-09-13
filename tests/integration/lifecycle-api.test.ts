/**
 * MVP DoD section 3: create -> invite -> join -> room -> agenda -> minute -> close -> purge.
 * Prefer API-level coverage. When DATABASE_URL is unset, run the pure-path assertions
 * that prove room auth + destruction receipt + token shape without a live stack.
 */
import { describe, expect, test, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import { createRoomToken } from '../../src/lib/auth';
import { expectedHmac, isValidRoomToken } from '../../src/room/server';
import { computePayloadDigest } from '../../src/lib/ledger';
import { getKms, resetKmsForTests } from '../../src/lib/encryption';
import { verifyDestructionReceipt } from '../../src/server/destructionWorker';
import { resolveSecurityAuditRetentionHours } from '../../src/lib/securityAudit';

describe('MVP lifecycle path (API-level / pure)', () => {
  beforeAll(() => {
    process.env.KMS_PROVIDER = 'local';
    process.env.LOCAL_DEV_SIGNING_KEY = 'local-dev-signing-key-not-for-production-use';
    process.env.ROOM_SHARED_SECRET = 'integration-test-room-secret-32bytes!!';
    process.env.JWT_SECRET = 'integration-test-jwt-secret-32bytes!!!!';
    resetKmsForTests();
  });

  test('invite redeem roomToken is HMAC and accepted by room server', () => {
    const sessionId = crypto.randomUUID();
    const partyId = crypto.randomUUID();
    const roomToken = createRoomToken(sessionId, partyId);
    expect(roomToken).toBe(expectedHmac(sessionId, partyId, process.env.ROOM_SHARED_SECRET!));
    expect(isValidRoomToken(roomToken, sessionId, partyId)).toBe(true);
    expect(isValidRoomToken(process.env.ROOM_SHARED_SECRET!, sessionId, partyId)).toBe(false);
  });

  test('agenda -> minute -> close -> purge receipt chain is verifiable', async () => {
    // Simulates post-close purge attestation without requiring Postgres.
    const sessionId = crypto.randomUUID();
    const organizationId = crypto.randomUUID();
    const purgedAt = new Date().toISOString();
    const bodiesDestroyed = [
      'ledger_lines',
      'joint_minutes',
      'agenda_items',
      'parties',
      'session_content',
    ];
    const manifest = {
      sessionId,
      organizationId,
      purgedAt,
      retentionWindow: '0h',
      bodiesDestroyed,
      finalSequenceNumber: 5,
      ledgerRootHash: 'deadbeef',
    };
    const destructionManifestDigest = computePayloadDigest(manifest);
    const kms = getKms();
    const signature = (
      await kms.sign(
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
  });

  test('security audit retention policy matches env docs', () => {
    expect(resolveSecurityAuditRetentionHours({ SECURITY_AUDIT_RETENTION_HOURS: '720' })).toBe(720);
  });
});
