/**
 * Refuse any snapshot or prompt payload that looks like speech, PII, or room content.
 * Intent: fail closed before a model provider is contacted.
 */

const FORBIDDEN_KEY =
  /^(message|messages|text|body|content|transcript|caption|audio|quote|speech|inviteCode|invite_code|deliveryAddress|delivery_address|displayLabel|display_label|email|password|roomToken|wsPayload|payload)$/i;

const FORBIDDEN_SUBSTRING = /transcript|speech|room.?message|chat.?histor/i;

export function assertSpeechFree(value: unknown, path = 'snapshot'): void {
  if (value == null) return;
  if (typeof value === 'string') {
    if (value.length > 280) {
      throw new Error(`Process copilot ${path} exceeds process-label length.`);
    }
    if (FORBIDDEN_SUBSTRING.test(value)) {
      throw new Error(`Process copilot ${path} looks like speech content.`);
    }
    return;
  }
  if (typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertSpeechFree(item, `${path}[${i}]`));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEY.test(key) || FORBIDDEN_SUBSTRING.test(key)) {
      throw new Error(`Process copilot snapshot contains forbidden key: ${path}.${key}`);
    }
    assertSpeechFree(child, `${path}.${key}`);
  }
}

export function sanitizeAgendaLabel(raw: string): string {
  const trimmed = raw.trim().slice(0, 80);
  if (FORBIDDEN_SUBSTRING.test(trimmed) || /\b(said|says|told|quoted)\b/i.test(trimmed) || /['"]/.test(trimmed)) {
    return 'Issue';
  }
  return trimmed || 'Issue';
}
