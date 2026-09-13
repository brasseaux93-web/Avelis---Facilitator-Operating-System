import { db } from '../db/index';
import { securityAuditEvents } from '../db/schema';

/**
 * Restricted security audit helper (ADR-0006).
 * Never accepts message bodies, invite codes, passwords, or speech.
 * Retention: default 30d (SECURITY_AUDIT_RETENTION_HOURS), max 90d - enforced by destructionWorker.
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

export const SECURITY_EVENT_TYPES = [
  'auth_failure',
  'auth_success',
  'invite_redeem_failure',
  'invite_rate_limited',
  'unauthorized_access',
  'purge_started',
  'purge_completed',
  'purge_failed',
  'startup_guard_ok',
  'startup_guard_failed',
  'tls_proxy_configured',
] as const;

export type SecurityEventType = (typeof SECURITY_EVENT_TYPES)[number];

const ALLOWED_EVENT_TYPES = new Set<string>(SECURITY_EVENT_TYPES);

export interface RecordSecurityEventInput {
  organizationId?: string | null;
  eventType: SecurityEventType;
  metadata?: Record<string, unknown>;
}

function scrubValue(v: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated-depth]';
  if (v == null) return v;
  if (typeof v === 'string') {
    if (v.includes('@') && v.indexOf('.') > v.indexOf('@')) {
      const at = v.lastIndexOf('@');
      return '*@' + v.slice(at + 1);
    }
    return v.length > 500 ? '[truncated]' : v;
  }
  if (typeof v !== 'object') return v;
  if (Array.isArray(v)) {
    return v.map((item) => scrubValue(item, depth + 1));
  }
  return scrubMetadata(v as Record<string, unknown>, depth + 1);
}

/** Recursively drop blocked keys and scrub nested values. */
export function scrubMetadata(
  meta: Record<string, unknown> | undefined,
  depth = 0
): Record<string, unknown> {
  if (!meta) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (BLOCKED_METADATA_KEYS.has(k)) continue;
    if (k.toLowerCase().includes('email') && typeof v === 'string') {
      const at = v.lastIndexOf('@');
      out[k] = at >= 0 ? '*@' + v.slice(at + 1) : '[redacted]';
      continue;
    }
    out[k] = scrubValue(v, depth);
  }
  return out;
}

/**
 * Insert a minimal security audit row. Does not accept message bodies.
 */
export async function recordSecurityEvent(input: RecordSecurityEventInput): Promise<void> {
  if (!ALLOWED_EVENT_TYPES.has(input.eventType)) {
    throw new Error('recordSecurityEvent refuses eventType: ' + input.eventType);
  }

  if (input.metadata) {
    for (const key of Object.keys(input.metadata)) {
      if (BLOCKED_METADATA_KEYS.has(key)) {
        throw new Error('recordSecurityEvent refuses metadata key: ' + key);
      }
    }
  }

  await db.insert(securityAuditEvents).values({
    organizationId: input.organizationId ?? null,
    eventType: input.eventType,
    metadata: scrubMetadata(input.metadata),
  });
}

/** Default 720h (30d), hard cap 2160h (90d). */
export function resolveSecurityAuditRetentionHours(
  env: NodeJS.ProcessEnv = process.env
): number {
  const raw = Number(env.SECURITY_AUDIT_RETENTION_HOURS ?? 720);
  const max = Number(env.MAX_SECURITY_AUDIT_RETENTION_HOURS ?? 2160);
  const hours = Number.isFinite(raw) && raw > 0 ? raw : 720;
  const cap = Number.isFinite(max) && max > 0 ? Math.min(max, 2160) : 2160;
  return Math.min(hours, cap);
}
