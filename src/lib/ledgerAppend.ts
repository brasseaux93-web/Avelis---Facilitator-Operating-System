import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { ledgerLines } from '../db/schema';
import { computePayloadDigest, computeLineHash } from './ledger';
import { canonicalizeLedgerPayload } from './ledgerPayload';
import { encryptJson } from './encryption';

/** Closed vocabulary — must match ledger_line_type enum in src/db/schema.ts */
export const ALLOWED_LEDGER_LINE_TYPES = [
  'session_opened',
  'session_closed',
  'session_close_failed',
  'room_destroyed',
  'invite_created',
  'invite_sent',
  'invite_delivery_failed',
  'invite_revoked',
  'party_joined',
  'party_declined',
  'party_left',
  'party_access_revoked',
  'identity_class_set',
  'identity_class_corrected',
  'agenda_item_tabled',
  'agenda_item_reordered',
  'agenda_item_marked',
  'caucus_opened',
  'caucus_closed',
  'caucus_access_changed',
  'process_mark_recorded',
  'ledger_line_published',
  'ledger_line_withdrawn_from_party_view',
  'joint_minute_created',
  'joint_minute_published',
  'joint_minute_initialed',
  'joint_minute_exported',
  'joint_minute_wiped',
  'retention_window_set',
  'purge_started',
  'purge_completed',
  'purge_failed',
  'destruction_attested',
] as const;

export type AllowedLedgerLineType = (typeof ALLOWED_LEDGER_LINE_TYPES)[number];

const allowedSet = new Set<string>(ALLOWED_LEDGER_LINE_TYPES);

const payloadSchema = z.record(z.string(), z.unknown());

export type ActorKind = 'facilitator' | 'party' | 'system';
export type LedgerSource =
  | 'facilitator_ui'
  | 'party_ui'
  | 'application_server'
  | 'room_server'
  | 'retention_job'
  | 'admin_correction';
export type InitialVisibility = 'facilitator_only' | 'party_visible';

export interface AppendLedgerLineArgs {
  sessionId: string;
  lineType: string;
  payload: Record<string, unknown>;
  actorKind: ActorKind;
  actorRef?: string | null;
  source: LedgerSource;
  initialVisibility: InitialVisibility;
  schemaVersion?: number;
  idempotencyKey?: string | null;
  occurredAt?: Date;
}

/** Drizzle db or transaction client — intentionally loose for tx compatibility. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LedgerDb = any;

export function isAllowedLedgerLineType(lineType: string): lineType is AllowedLedgerLineType {
  return allowedSet.has(lineType);
}

/**
 * Append a ledger line inside an existing transaction (or db) with
 * sequential numbering and hash chaining via computePayloadDigest / computeLineHash.
 */
export async function appendLedgerLine(txOrDb: LedgerDb, args: AppendLedgerLineArgs) {
  if (!isAllowedLedgerLineType(args.lineType)) {
    throw new Error(`Invalid lineType: ${args.lineType}`);
  }

  const parsedPayload = payloadSchema.safeParse(args.payload);
  if (!parsedPayload.success) {
    throw new Error('payload must be a plain object (Record<string, unknown>)');
  }
  const payload = canonicalizeLedgerPayload(args.lineType, parsedPayload.data);

  if (args.idempotencyKey) {
    const existing = await txOrDb
      .select()
      .from(ledgerLines)
      .where(
        and(
          eq(ledgerLines.sessionId, args.sessionId),
          eq(ledgerLines.idempotencyKey, args.idempotencyKey)
        )
      )
      .limit(1);
    if (existing[0]) {
      return existing[0];
    }
  }

  // Lock last line for this session (FOR UPDATE) to serialize sequence allocation.
  const [last] = await txOrDb
    .select({
      sequenceNumber: ledgerLines.sequenceNumber,
      lineHash: ledgerLines.lineHash,
    })
    .from(ledgerLines)
    .where(eq(ledgerLines.sessionId, args.sessionId))
    .orderBy(desc(ledgerLines.sequenceNumber))
    .limit(1)
    .for('update');

  const sequenceNumber = last ? last.sequenceNumber + 1 : 1;
  const previousLineHash = last ? last.lineHash : null;
  const payloadDigest = computePayloadDigest(payload);
  const lineHash = computeLineHash(
    args.sessionId,
    sequenceNumber,
    args.lineType,
    payloadDigest,
    previousLineHash
  );
  const occurredAt = args.occurredAt ?? new Date();
  const schemaVersion = args.schemaVersion ?? 1;
  const storedPayload = await encryptJson(payload);

  const [inserted] = await txOrDb
    .insert(ledgerLines)
    .values({
      sessionId: args.sessionId,
      sequenceNumber,
      lineType: args.lineType,
      payload: storedPayload,
      payloadDigest,
      actorKind: args.actorKind,
      actorRef: args.actorRef ?? null,
      source: args.source,
      occurredAt,
      schemaVersion,
      initialVisibility: args.initialVisibility,
      previousLineHash,
      lineHash,
      idempotencyKey: args.idempotencyKey ?? null,
    })
    .returning();

  return { ...inserted, payload };
}
