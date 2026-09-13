import { describe, expect, test } from 'vitest';
import { renderMinutePdf } from '../src/lib/minutePdf';

describe('joint minute PDF', () => {
  test('is a PDF in memory and is not a transcript wrapper', () => {
    const buf = renderMinutePdf({
      title: 'Settlement talk',
      status: 'published',
      body: 'The parties agree the night-shift coverage is a constraint.\n\nNot a quote of the room.',
      exportedAt: '2026-09-13T00:00:00.000Z',
    });
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buf.toString()).toContain('Settlement talk');
    expect(buf.toString()).toContain('not a transcript');
    expect(buf.toString()).toContain('%%EOF');
  });
});
