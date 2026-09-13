import { describe, expect, test } from 'vitest';
import {
  resolveSecurityAuditRetentionHours,
  scrubMetadata,
  SECURITY_EVENT_TYPES,
} from '../../src/lib/securityAudit';

describe('Security audit retention + scrub', () => {
  test('default retention is 720h and hard-capped at 2160h', () => {
    expect(resolveSecurityAuditRetentionHours({})).toBe(720);
    expect(
      resolveSecurityAuditRetentionHours({
        SECURITY_AUDIT_RETENTION_HOURS: '99999',
        MAX_SECURITY_AUDIT_RETENTION_HOURS: '2160',
      })
    ).toBe(2160);
    expect(
      resolveSecurityAuditRetentionHours({
        SECURITY_AUDIT_RETENTION_HOURS: '48',
      })
    ).toBe(48);
  });

  test('scrubMetadata recursively drops blocked nested keys', () => {
    const scrubbed = scrubMetadata({
      reason: 'ok',
      context: { body: 'session speech', nested: { text: 'nope', code: 1 } },
      list: [{ message: 'x' }, { safe: true }],
    });
    expect(scrubbed.reason).toBe('ok');
    expect((scrubbed.context as Record<string, unknown>).body).toBeUndefined();
    expect(
      ((scrubbed.context as Record<string, unknown>).nested as Record<string, unknown>).text
    ).toBeUndefined();
    expect(
      ((scrubbed.context as Record<string, unknown>).nested as Record<string, unknown>).code
    ).toBe(1);
    expect((scrubbed.list as unknown[])[0]).toEqual({});
    expect((scrubbed.list as unknown[])[1]).toEqual({ safe: true });
  });

  test('allowlisted event types are closed vocabulary', () => {
    expect(SECURITY_EVENT_TYPES).toContain('purge_completed');
    expect(SECURITY_EVENT_TYPES).not.toContain('custom_speech');
  });
});
