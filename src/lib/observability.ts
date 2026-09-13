import crypto from 'node:crypto';
/**
 * Observability without content.
 * Structured logs never include bodies, WS payloads, invite codes, or full emails.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLog {
  level: LogLevel;
  event: string;
  requestId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

/** In-memory counters - no per-party metrics. */
export const metrics = {
  sessions_opened: 0,
  sessions_closed: 0,
  purge_success: 0,
  purge_failure: 0,
  security_audit_purged: 0,
};

export type MetricName = keyof typeof metrics;

export function incrementMetric(name: MetricName, by = 1): void {
  metrics[name] += by;
}

export function getMetricsSnapshot(): Readonly<typeof metrics> {
  return { ...metrics };
}

/** Redact email to domain-only when logging is unavoidable. */
export function emailDomainOnly(email: string | undefined | null): string | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const at = email.lastIndexOf('@');
  if (at < 0) return '[redacted]';
  return '*@' + email.slice(at + 1);
}

const FORBIDDEN_KEYS = new Set([
  'body',
  'password',
  'inviteCode',
  'invite_code',
  'roomToken',
  'token',
  'authorization',
  'text',
  'message',
  'payload',
  'content',
  'wsPayload',
  'websocketPayload',
]);

function looksLikeEmail(v: string): boolean {
  const at = v.indexOf('@');
  if (at <= 0) return false;
  const domain = v.slice(at + 1);
  return domain.includes('.') && !v.includes(' ') && !v.includes(String.fromCharCode(10));
}

/**
 * Sanitize client-supplied request IDs.
 * Never log emails; strip '@'; reject email-like values (server generates UUID).
 */
export function sanitizeRequestId(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') {
    return cryptoRandomUuid();
  }
  const trimmed = raw.trim().slice(0, 128);
  if (!trimmed || looksLikeEmail(trimmed) || trimmed.includes('@')) {
    return cryptoRandomUuid();
  }
  const cleaned = Array.from(trimmed).filter((ch) => ch !== '@' && ch.charCodeAt(0) > 31).join('');
  if (!cleaned || cleaned.length < 8) {
    return cryptoRandomUuid();
  }
  return cleaned;
}

function cryptoRandomUuid(): string {
  return crypto.randomUUID();
}

function sanitizeStringValue(k: string, v: string): string {
  if (k.toLowerCase().includes('email') || looksLikeEmail(v) || v.includes('@')) {
    return emailDomainOnly(v) || '[redacted]';
  }
  if (k === 'requestId' || k.toLowerCase() === 'requestid') {
    return sanitizeRequestId(v);
  }
  return v;
}

function sanitizeFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (FORBIDDEN_KEYS.has(k)) continue;
    if (typeof v === 'string') {
      out[k] = sanitizeStringValue(k, v);
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function logEvent(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {}
): void {
  const entry: StructuredLog = {
    level,
    event,
    ...sanitizeFields(fields),
    ts: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

const DANGEROUS_FLAGS = [
  'LOG_REQUEST_BODIES',
  'LOG_WEBSOCKET_PAYLOADS',
  'SESSION_REPLAY_ENABLED',
  'PRODUCT_ANALYTICS_ENABLED',
] as const;

/**
 * Fail fast in production if content-capturing flags are enabled.
 */
export function assertProductionObservabilityGuards(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const violations: string[] = [];
  for (const flag of DANGEROUS_FLAGS) {
    const v = (process.env[flag] || 'false').toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') {
      violations.push(flag);
    }
  }
  if (violations.length > 0) {
    throw new Error(
      'Production refused to start: content-capture flags must be false: ' +
        violations.join(', ')
    );
  }
}

/** Used by CI script and tests - check flags without requiring NODE_ENV=production. */
export function listEnabledDangerousObservabilityFlags(
  env: NodeJS.ProcessEnv = process.env
): string[] {
  const violations: string[] = [];
  for (const flag of DANGEROUS_FLAGS) {
    const v = (env[flag] || 'false').toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') {
      violations.push(flag);
    }
  }
  return violations;
}
