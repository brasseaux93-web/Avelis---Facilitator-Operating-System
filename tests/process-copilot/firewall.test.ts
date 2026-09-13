import { describe, expect, test } from 'vitest';
import { assertSpeechFree, sanitizeAgendaLabel } from '../../src/lib/processCopilot/firewall';

describe('process copilot firewall', () => {
  test('accepts a process-only snapshot', () => {
    expect(() =>
      assertSpeechFree({
        sessionStatus: 'open',
        partyCounts: { pending: 1, joined: 2, declined: 0, left: 0, revoked: 0 },
        agenda: [{ id: 'a', label: 'Working hours', status: 'tabled' }],
      })
    ).not.toThrow();
  });

  test('rejects room message keys', () => {
    expect(() => assertSpeechFree({ messages: ['hello'] })).toThrow(/forbidden key/);
  });

  test('rejects transcript-shaped keys', () => {
    expect(() => assertSpeechFree({ transcript: 'said' })).toThrow(/forbidden/);
  });

  test('rejects display labels (PII)', () => {
    expect(() => assertSpeechFree({ displayLabel: 'Jordan' })).toThrow(/forbidden/);
  });

  test('rejects invite codes', () => {
    expect(() => assertSpeechFree({ inviteCode: 'abc' })).toThrow(/forbidden/);
  });

  test('sanitizes agenda labels that look like speech artifacts', () => {
    expect(sanitizeAgendaLabel('transcript of caucus')).toBe('Issue');
    expect(sanitizeAgendaLabel('Working hours')).toBe('Working hours');
  });
});
