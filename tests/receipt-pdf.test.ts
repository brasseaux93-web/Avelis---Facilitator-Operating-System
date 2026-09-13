import { describe, expect, test } from 'vitest';
import { exportLeftNoTrace, renderReceiptPdfBytes } from '../src/lib/receiptPdf';

describe('destruction receipt PDF', () => {
  test('is a PDF in memory and names the ledger root', () => {
    const buf = renderReceiptPdfBytes({
      sessionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      purgedAt: '2026-09-13T00:00:00.000Z',
      retentionWindow: '24h',
      bodiesDestroyed: ['ledger_lines', 'joint_minutes'],
      finalSequenceNumber: 4,
      ledgerRootHash: 'abc123def',
      destructionManifestDigest: 'digest',
      valid: true,
    });
    const text = new TextDecoder().decode(buf);
    expect(text.slice(0, 5)).toBe('%PDF-');
    expect(text).toContain('abc123def');
    expect(text).toContain('Not a transcript');
  });

  test('export leaves no localStorage keys in this environment', () => {
    expect(exportLeftNoTrace().localStorageKeys).toEqual([]);
  });
});
