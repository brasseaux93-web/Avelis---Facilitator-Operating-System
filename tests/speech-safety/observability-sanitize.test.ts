import { describe, expect, test } from 'vitest';
import { sanitizeRequestId, listEnabledDangerousObservabilityFlags } from '../../src/lib/observability';

describe('Observability sanitization', () => {
  test('sanitizeRequestId rejects email-like client headers', () => {
    const id = sanitizeRequestId('person@example.com');
    expect(id).not.toContain('@');
    expect(id).not.toBe('person@example.com');
  });

  test('sanitizeRequestId strips @ and regenerates when unsafe', () => {
    const id = sanitizeRequestId('abc@def');
    expect(id.includes('@')).toBe(false);
  });

  test('sanitizeRequestId keeps opaque uuid-like ids', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    expect(sanitizeRequestId(raw)).toBe(raw);
  });

  test('dangerous observability flags detected', () => {
    expect(
      listEnabledDangerousObservabilityFlags({ LOG_REQUEST_BODIES: 'true' })
    ).toContain('LOG_REQUEST_BODIES');
  });
});
