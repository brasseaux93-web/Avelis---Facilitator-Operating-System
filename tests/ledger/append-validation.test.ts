import { expect, test, describe } from 'vitest';
import { computePayloadDigest, computeLineHash } from '../../src/lib/ledger';
import {
  ALLOWED_LEDGER_LINE_TYPES,
  isAllowedLedgerLineType,
} from '../../src/lib/ledgerAppend';

describe('Ledger append validation / hash chain', () => {
  test('computeLineHash chains: each line depends on previous hash', () => {
    const sessionId = '11111111-1111-4111-8111-111111111111';
    const d1 = computePayloadDigest({ event: 'open' });
    const h1 = computeLineHash(sessionId, 1, 'session_opened', d1, null);

    const d2 = computePayloadDigest({ retentionHours: 72 });
    const h2 = computeLineHash(sessionId, 2, 'retention_window_set', d2, h1);

    const d3 = computePayloadDigest({ event: 'close' });
    const h3 = computeLineHash(sessionId, 3, 'session_closed', d3, h2);

    expect(h1).toHaveLength(64);
    expect(h2).toHaveLength(64);
    expect(h3).toHaveLength(64);
    expect(h1).not.toBe(h2);
    expect(h2).not.toBe(h3);

    // Tampering previous hash breaks the chain tip.
    const broken = computeLineHash(sessionId, 3, 'session_closed', d3, 'tampered-prev');
    expect(broken).not.toBe(h3);

    // Same inputs are deterministic.
    expect(computeLineHash(sessionId, 2, 'retention_window_set', d2, h1)).toBe(h2);
  });

  test('ALLOWED_LEDGER_LINE_TYPES is closed and includes lifecycle events', () => {
    expect(ALLOWED_LEDGER_LINE_TYPES.length).toBeGreaterThan(10);
    expect(isAllowedLedgerLineType('session_opened')).toBe(true);
    expect(isAllowedLedgerLineType('session_closed')).toBe(true);
    expect(isAllowedLedgerLineType('room_destroyed')).toBe(true);
    expect(isAllowedLedgerLineType('retention_window_set')).toBe(true);
    expect(isAllowedLedgerLineType('destruction_attested')).toBe(true);
    expect(isAllowedLedgerLineType('SESSION OPENED')).toBe(false);
    expect(isAllowedLedgerLineType('not_a_real_type')).toBe(false);
  });
});
