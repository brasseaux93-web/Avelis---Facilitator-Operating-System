/**
 * Closed ledger payloads. Unknown keys are rejected. Speech-shaped values are rejected.
 * Call sites may send camelCase; it is mapped to the spec names.
 */
import { z } from 'zod';

const KEY_MAP: Record<string, string> = {
  partyId: 'party_id',
  caucusId: 'caucus_id',
  minuteId: 'minute_id',
  agendaItemId: 'item_id',
  itemId: 'item_id',
  lineId: 'target_line_id',
  targetLineId: 'target_line_id',
  retentionHours: 'retention_hours',
  identityClass: 'identity_class',
  deliveryChannel: 'delivery_channel',
  fromSortOrder: 'from_sort_order',
  toSortOrder: 'to_sort_order',
  sortOrder: 'to_sort_order',
  status: 'mark',
  contentDigest: 'content_digest',
  reasonCode: 'reason_code',
  destructionMethod: 'destruction_method',
  retentionExpiresAt: 'retention_expires_at',
  destructionManifestDigest: 'destruction_manifest_digest',
  ledgerRootHash: 'ledger_root_hash',
  receiptId: 'receipt_id',
  purgedAt: 'purged_at',
  retentionWindow: 'retention_window',
  bodiesDestroyed: 'bodies_destroyed',
  fromIdentityClass: 'from_identity_class',
  toIdentityClass: 'to_identity_class',
};

/** Known extras from older writers — dropped, not stored. */
const LEGACY_DROP = new Set([
  'openedAt',
  'closedAt',
  'sequenceNumber',
  'titleDigest',
  'title',
  'resent',
  'evaluation',
  'roomExisted',
  'destroyedAt',
]);

const SPEECH = /\b(said|says|told|quoted|transcript)\b/i;

const uuid = z.string().uuid();
const identity = z.enum(['named', 'role_only', 'affiliation_only', 'unnamed']);
const channel = z.enum(['email', 'copy_link']);

const SCHEMAS: Record<string, z.ZodType> = {
  session_opened: z.object({}).strict(),
  session_closed: z.object({}).strict(),
  session_close_failed: z.object({ reason_code: z.string().min(1).max(64) }).strict(),
  room_destroyed: z
    .object({
      destruction_method: z.enum(['process_terminated', 'memory_cleared']),
      result: z.enum(['completed', 'failed']),
    })
    .strict(),
  invite_created: z.object({ party_id: uuid, delivery_channel: channel }).strict(),
  invite_sent: z
    .object({ party_id: uuid, delivery_channel: channel, result: z.literal('sent') })
    .strict(),
  invite_delivery_failed: z
    .object({
      party_id: uuid,
      delivery_channel: channel,
      reason_code: z.string().min(1).max(64),
    })
    .strict(),
  invite_revoked: z.object({ party_id: uuid }).strict(),
  party_joined: z.object({ party_id: uuid, identity_class: identity }).strict(),
  party_declined: z.object({ party_id: uuid }).strict(),
  party_left: z.object({ party_id: uuid }).strict(),
  party_access_revoked: z
    .object({ party_id: uuid, reason_code: z.string().min(1).max(64) })
    .strict(),
  identity_class_set: z.object({ party_id: uuid, identity_class: identity }).strict(),
  identity_class_corrected: z
    .object({
      party_id: uuid,
      from_identity_class: identity,
      to_identity_class: identity,
    })
    .strict(),
  agenda_item_tabled: z.object({ item_id: uuid }).strict(),
  agenda_item_reordered: z
    .object({
      item_id: uuid,
      from_sort_order: z.number().int(),
      to_sort_order: z.number().int(),
    })
    .strict(),
  agenda_item_marked: z
    .object({ item_id: uuid, mark: z.enum(['agreed', 'parked', 'refused', 'tabled']) })
    .strict(),
  caucus_opened: z.object({ caucus_id: uuid }).strict(),
  caucus_closed: z.object({ caucus_id: uuid }).strict(),
  caucus_access_changed: z
    .object({
      caucus_id: uuid,
      party_id: uuid,
      action: z.enum(['added', 'removed']),
    })
    .strict(),
  process_mark_recorded: z
    .object({
      mark: z.enum(['pause_called', 'return_to_plenary', 'process_complete']),
    })
    .strict(),
  ledger_line_published: z.object({ target_line_id: uuid }).strict(),
  ledger_line_withdrawn_from_party_view: z.object({ target_line_id: uuid }).strict(),
  joint_minute_created: z.object({ minute_id: uuid }).strict(),
  joint_minute_published: z
    .object({ minute_id: uuid, content_digest: z.string().min(8) })
    .strict(),
  joint_minute_initialed: z
    .object({ minute_id: uuid, party_id: uuid, content_digest: z.string().min(8) })
    .strict(),
  joint_minute_exported: z
    .object({
      minute_id: uuid,
      format: z.enum(['pdf', 'markdown']),
      content_digest: z.string().min(8),
    })
    .strict(),
  joint_minute_wiped: z
    .object({ minute_id: uuid, result: z.enum(['completed', 'failed']) })
    .strict(),
  retention_window_set: z.object({ retention_hours: z.number().int().min(0).max(720) }).strict(),
  purge_started: z.object({ retention_expires_at: z.string().min(1) }).strict(),
  purge_completed: z
    .object({ destruction_manifest_digest: z.string().min(8), result: z.literal('completed') })
    .strict(),
  purge_failed: z.object({ reason_code: z.string().min(1).max(64) }).strict(),
  destruction_attested: z
    .object({
      receipt_id: uuid,
      purged_at: z.string().min(1),
      retention_window: z.string().min(1).max(16),
      bodies_destroyed: z.array(z.string()),
      ledger_root_hash: z.string().min(8),
      destruction_manifest_digest: z.string().min(8),
    })
    .strict(),
};

export function canonicalizeLedgerPayload(
  lineType: string,
  raw: Record<string, unknown>
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (LEGACY_DROP.has(key)) continue;
    const dest = KEY_MAP[key] || key;
    mapped[dest] = value;
  }

  if (lineType === 'invite_created' && mapped.delivery_channel == null) {
    mapped.delivery_channel = 'copy_link';
  }
  if (lineType === 'room_destroyed') {
    if (mapped.destruction_method == null) mapped.destruction_method = 'process_terminated';
    if (mapped.result == null) mapped.result = 'completed';
  }
  if (lineType === 'joint_minute_wiped' && mapped.result == null) {
    mapped.result = 'completed';
  }
  if (lineType === 'agenda_item_reordered' && mapped.from_sort_order == null) {
    mapped.from_sort_order = 0;
  }

  for (const value of Object.values(mapped)) {
    if (typeof value === 'string' && (SPEECH.test(value) || /['"]/.test(value))) {
      throw new Error('payload must not contain speech, quotes, or narrative');
    }
  }

  const schema = SCHEMAS[lineType];
  if (!schema) {
    throw new Error(`No payload schema for lineType: ${lineType}`);
  }
  const parsed = schema.safeParse(mapped);
  if (!parsed.success) {
    throw new Error('payload must match the closed schema for ' + lineType);
  }
  return parsed.data as Record<string, unknown>;
}
