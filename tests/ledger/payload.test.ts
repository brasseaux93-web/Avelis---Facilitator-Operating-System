import { describe, expect, test } from 'vitest';
import { canonicalizeLedgerPayload } from '../../src/lib/ledgerPayload';
import crypto from 'node:crypto';

describe('closed ledger payloads', () => {
  test('maps camelCase and drops unknown extras for session_opened', () => {
    expect(canonicalizeLedgerPayload('session_opened', { openedAt: 'no' })).toEqual({});
  });

  test('rejects quotes and speech', () => {
    expect(() =>
      canonicalizeLedgerPayload('process_mark_recorded', { mark: 'pause_called', note: 'she said never' })
    ).toThrow(/speech|schema/i);
    expect(() =>
      canonicalizeLedgerPayload('session_opened', { note: 'she said "never"' })
    ).toThrow(/speech|schema/i);
  });

  test('invite_created requires a party id and defaults copy_link', () => {
    const id = crypto.randomUUID();
    expect(canonicalizeLedgerPayload('invite_created', { partyId: id })).toEqual({
      party_id: id,
      delivery_channel: 'copy_link',
    });
  });
});
