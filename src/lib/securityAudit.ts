import { db } from '../db/index';
import { securityAuditEvents } from '../db/schema';

/**
 * Restricted security audit helper (ADR-0006).
 * Never accepts message bodies, invite codes, passwords, or speech.
 * Retention: default 30d (SECURITY_AUDIT_RETENTION_HOURS), max 90d — see docs/deployment.md.
 */

const BLOCKED_METADATA_KEYS = new Set([
  'body',
  'text',
  'message',
  'content',
  'payload',
  'inviteCode',
  'invite_code',
  'password',
  'roomToken',
  'authorization',
  'speech',
  'wsPayload',
]);

export type SecurityEventType =
  | 'auth_failure'
  | 'auth_success'
  | 'invite_redeem_failure'
  | 'invite_rate_limited'
  | 'unauthorized_access'
  | 'purge_started'
  | 'purge_completed'
  | 'purge_failed'
  | 'startup_guard_ok'
  | 'startup_guard_failed'
  | 'tls_proxy_configured';

export interface RecordSecurityEventInput {
  organizationId?: string | null;
  eventType: SecurityEventType | string;
  metadata?: Record<string, unknown>;
}

function scrubMetadata(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (BLOCKED_METADATA_KEYS.has(k)) continue;
    if (typeof v === 'string' && v.length > 500) {
      out[k] = '[truncated]';
      continue;
    }
    out[k] = v;
  }
  return out;
}

/**
 * Insert a minimal security audit row. Does not accept message bodies.
 */
export async function recordSecurityEvent(input: RecordSecurityEventInput): Promise<void> {
  // Hard refuse accidental body fields at the API boundary.
  if (input.metadata) {
    for (const key of Object.keys(input.metadata)) {
      if (BLOCKED_METADATA_KEYS.has(key)) {
        throw new Error(`recordSecurityEvent refuses metadata key: ${key}`);
      }
    }
  }

  await db.insert(securityAuditEvents).values({
    organizationId: input.organizationId ?? null,
    eventType: input.eventType,
    metadata: scrubMetadata(input.metadata),
  });
}
