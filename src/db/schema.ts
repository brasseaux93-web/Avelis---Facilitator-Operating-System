import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  bigint,
  smallint,
  jsonb,
  pgEnum,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const facilitatorStatusEnum = pgEnum('facilitator_status', ['active', 'suspended', 'offboarded']);
export const sessionStatusEnum = pgEnum('session_status', ['draft', 'open', 'closed', 'purged']);
export const identityClassEnum = pgEnum('identity_class', ['named', 'role_only', 'affiliation_only', 'unnamed']);
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'joined', 'declined', 'left', 'revoked']);
export const agendaItemStatusEnum = pgEnum('agenda_item_status', ['tabled', 'agreed', 'parked', 'refused']);
export const actorKindEnum = pgEnum('actor_kind', ['facilitator', 'party', 'system']);
export const sourceEnum = pgEnum('source', ['facilitator_ui', 'party_ui', 'application_server', 'room_server', 'retention_job', 'admin_correction']);
export const visibilityEnum = pgEnum('initial_visibility', ['facilitator_only', 'party_visible']);
export const ledgerRootReasonEnum = pgEnum('ledger_root_reason', ['session_closed', 'pre_purge', 'destruction_attestation', 'integrity_checkpoint']);
export const jointMinuteStatusEnum = pgEnum('joint_minute_status', ['draft', 'published', 'wiped']);
export const attestedByKindEnum = pgEnum('attested_by_kind', ['system', 'facilitator']);

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  region: text('region').notNull(),
  encryptionKeyId: text('encryption_key_id').notNull(),
  signingKeyId: text('signing_key_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const facilitatorAccounts = pgTable('facilitator_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  status: facilitatorStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  facilitatorId: uuid('facilitator_id').references(() => facilitatorAccounts.id).notNull(),
  title: text('title').notNull(),
  status: sessionStatusEnum('status').notNull().default('draft'),
  retentionHours: integer('retention_hours').notNull(),
  retentionExpiresAt: timestamp('retention_expires_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  purgedAt: timestamp('purged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxSessionsFacilitatorStatus: index('idx_sessions_facilitator_status').on(table.facilitatorId, table.status),
  idxSessionsOrgStatus: index('idx_sessions_org_status').on(table.organizationId, table.status),
  idxSessionsRetentionExpiry: index('idx_sessions_retention_expiry').on(table.retentionExpiresAt).where(sql`${table.status} = 'closed'`),
}));

export const parties = pgTable('parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  identityClass: identityClassEnum('identity_class').notNull(),
  displayLabel: text('display_label').notNull(),
  deliveryAddress: text('delivery_address'),
  inviteCodeHash: text('invite_code_hash'),
  inviteStatus: inviteStatusEnum('invite_status').notNull().default('pending'),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  leftAt: timestamp('left_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxPartiesSession: index('idx_parties_session').on(table.sessionId),
}));

export const agendaItems = pgTable('agenda_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull(),
  status: agendaItemStatusEnum('status').notNull().default('tabled'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxAgendaSessionOrder: index('idx_agenda_session_order').on(table.sessionId, table.sortOrder),
}));

export const ledgerLineTypeEnum = pgEnum('ledger_line_type', [
  'session_opened', 'session_closed', 'session_close_failed', 'room_destroyed',
  'invite_created', 'invite_sent', 'invite_delivery_failed', 'invite_revoked',
  'party_joined', 'party_declined', 'party_left', 'party_access_revoked',
  'identity_class_set', 'identity_class_corrected',
  'agenda_item_tabled', 'agenda_item_reordered', 'agenda_item_marked',
  'caucus_opened', 'caucus_closed', 'caucus_access_changed',
  'process_mark_recorded',
  'ledger_line_published', 'ledger_line_withdrawn_from_party_view',
  'joint_minute_created', 'joint_minute_published', 'joint_minute_initialed', 'joint_minute_exported', 'joint_minute_wiped',
  'retention_window_set', 'purge_started', 'purge_completed', 'purge_failed', 'destruction_attested'
]);

export const ledgerLines = pgTable('ledger_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  sequenceNumber: bigint('sequence_number', { mode: 'number' }).notNull(),
  lineType: ledgerLineTypeEnum('line_type').notNull(),
  payload: jsonb('payload').notNull(),
  payloadDigest: text('payload_digest').notNull(),
  actorKind: actorKindEnum('actor_kind').notNull(),
  actorRef: uuid('actor_ref'),
  source: sourceEnum('source').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  idempotencyKey: text('idempotency_key'),
  schemaVersion: smallint('schema_version').notNull(),
  initialVisibility: visibilityEnum('initial_visibility').notNull(),
  previousLineHash: text('previous_line_hash'),
  lineHash: text('line_hash').notNull(),
}, (table) => ({
  uqLedgerSessionSequence: uniqueIndex('uq_ledger_session_sequence').on(table.sessionId, table.sequenceNumber),
  uqLedgerSessionIdempotency: uniqueIndex('uq_ledger_session_idempotency').on(table.sessionId, table.idempotencyKey).where(sql`${table.idempotencyKey} IS NOT NULL`),
  idxLedgerSessionSequenceRead: index('idx_ledger_session_sequence_read').on(table.sessionId, table.sequenceNumber),
}));

export const ledgerRoots = pgTable('ledger_roots', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  lastSequenceNumber: bigint('last_sequence_number', { mode: 'number' }).notNull(),
  lastLineHash: text('last_line_hash').notNull(),
  reason: ledgerRootReasonEnum('reason').notNull(),
  signedAt: timestamp('signed_at', { withTimezone: true }).defaultNow().notNull(),
  signatureAlgorithm: text('signature_algorithm').notNull(),
  keyReference: text('key_reference').notNull(),
  signature: text('signature').notNull(),
}, (table) => ({
  idxLedgerRootsSession: index('idx_ledger_roots_session').on(table.sessionId, table.signedAt),
}));

export const jointMinutes = pgTable('joint_minutes', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  content: text('content'),
  contentDigest: text('content_digest'),
  status: jointMinuteStatusEnum('status').notNull().default('draft'),
  initialedBy: uuid('initialed_by').array(),
  lastExportedAt: timestamp('last_exported_at', { withTimezone: true }),
  wipedAt: timestamp('wiped_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const destructionReceipts = pgTable('destruction_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  purgedAt: timestamp('purged_at', { withTimezone: true }).notNull(),
  retentionWindow: text('retention_window').notNull(),
  bodiesDestroyed: text('bodies_destroyed').array().notNull(),
  finalSequenceNumber: bigint('final_sequence_number', { mode: 'number' }).notNull(),
  ledgerRootHash: text('ledger_root_hash').notNull(),
  destructionManifestDigest: text('destruction_manifest_digest').notNull(),
  attestedByKind: attestedByKindEnum('attested_by_kind').notNull(),
  signature: text('signature').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uqDestructionReceiptSession: uniqueIndex('uq_destruction_receipt_session').on(table.sessionId),
}));

/** Restricted security audit store (ADR-0006). Retention default 30d / max 90d. */
export const securityAuditEvents = pgTable('security_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  eventType: text('event_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata').notNull().default({}),
}, (table) => ({
  idxSecurityAuditOrgCreated: index('idx_security_audit_org_created').on(table.organizationId, table.createdAt),
  idxSecurityAuditCreated: index('idx_security_audit_created').on(table.createdAt),
}));
