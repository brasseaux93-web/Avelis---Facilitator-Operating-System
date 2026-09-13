import { describe, expect, test, beforeAll } from 'vitest';
import { computePayloadDigest } from '../../src/lib/ledger';
import { getKms, resetKmsForTests } from '../../src/lib/encryption';
import { verifyDestructionReceipt } from '../../src/server/destructionWorker';

describe('Destruction receipt verification', () => {
  beforeAll(() => {
    process.env.KMS_PROVIDER = 'local';
    process.env.LOCAL_DEV_SIGNING_KEY = 'local-dev-signing-key-not-for-production-use';
    resetKmsForTests();
  });

  test('signed destruction manifest verifies after purge', async () => {
    const kms = getKms();
    const signingKeyId = process.env.LOCAL_DEV_SIGNING_KEY!;
    const purgedAt = new Date().toISOString();
    const manifest = {
      sessionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      organizationId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      purgedAt,
      retentionWindow: '0h',
      bodiesDestroyed: ['ledger_lines', 'joint_minutes', 'agenda_items', 'parties', 'session_content'],
      finalSequenceNumber: 3,
      ledgerRootHash: 'abc123',
    };
    const destructionManifestDigest = computePayloadDigest(manifest);
    const signature = (
      await kms.sign(signingKeyId, Buffer.from(destructionManifestDigest, 'hex'))
    ).toString('hex');

    const ok = await verifyDestructionReceipt({
      ...manifest,
      purgedAt,
      destructionManifestDigest,
      signature,
    });
    expect(ok).toBe(true);

    const tampered = await verifyDestructionReceipt({
      ...manifest,
      purgedAt,
      ledgerRootHash: 'tampered',
      destructionManifestDigest,
      signature,
    });
    expect(tampered).toBe(false);
  });
});
