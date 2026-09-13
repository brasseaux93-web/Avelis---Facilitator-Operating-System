# Data Model

> Avelis persists only bounded process data. Rooms and caucus content are runtime-only. Speech is never a database entity.

## 1. Entity overview

```text
Organization
  └── FacilitatorAccount
        └── Session
              ├── Party
              ├── AgendaItem
              ├── LedgerLine
              ├── LedgerRoot
              ├── JointMinute
              └── DestructionReceipt

Runtime only:
  ├── Room
  └── Caucus
```

The restricted security audit record is operational infrastructure, not a session-product entity. It is separately access-controlled and must not contain speech or behavioral telemetry.

## 2. Organization

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | text | Host organization name |
| `region` | text | Deployment and data-residency region |
| `encryption_key_id` | text | External KMS key reference |
| `signing_key_id` | text | External KMS signing-key reference |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

One organization is one encryption scope.

## 3. FacilitatorAccount

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign key to organization |
| `email` | encrypted text | Unique within organization |
| `display_name` | encrypted text | Session display label |
| `password_hash` | text | Argon2id |
| `status` | enum | `active`, `suspended`, `offboarded` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

No facilitator profile, biography, avatar, public directory, or participant-facing social presence exists.

## 4. Session

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Denormalized authorization scope |
| `facilitator_id` | UUID | Session owner |
| `title` | encrypted text | Process title only; not a case narrative |
| `status` | enum | `draft`, `open`, `closed`, `purged` |
| `retention_hours` | integer | 0–720; immutable after opening |
| `retention_expires_at` | timestamptz | Calculated at close |
| `opened_at` | timestamptz, nullable | |
| `closed_at` | timestamptz, nullable | |
| `purged_at` | timestamptz, nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

State transition order:

```text
draft → open → closed → purged
```

No normal backward transitions exist.

## 5. Party

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `session_id` | UUID | Foreign key to session |
| `identity_class` | enum | `named`, `role_only`, `affiliation_only`, `unnamed` |
| `display_label` | encrypted text | Session-scoped visible label |
| `delivery_address` | encrypted text | Email or telephone used only for invite delivery |
| `invite_code_hash` | text | Hash only; never store raw code |
| `invite_status` | enum | `pending`, `joined`, `declined`, `left`, `revoked` |
| `joined_at` | timestamptz, nullable | |
| `left_at` | timestamptz, nullable | |
| `created_at` | timestamptz | |

A party exists only in one session. No cross-session participant table, directory, or social graph exists.

`identity_class` may be corrected by a facilitator only before session open. It becomes immutable at join.

## 6. AgendaItem

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `session_id` | UUID | Foreign key to session |
| `title` | encrypted text | Process label only |
| `sort_order` | integer | Ordered within session |
| `status` | enum | `tabled`, `agreed`, `parked`, `refused` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

An agenda label must not contain a transcript excerpt, paraphrase of a participant statement, or facilitator interpretation.

## 7. LedgerLine

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Globally unique identifier |
| `session_id` | UUID | Foreign key to session |
| `sequence_number` | bigint | Unique and increasing within session |
| `line_type` | enum | Closed vocabulary only |
| `payload` | encrypted JSONB | Strict schema per type |
| `payload_digest` | text | Digest of canonical payload bytes |
| `actor_kind` | enum | `facilitator`, `party`, `system` |
| `actor_ref` | UUID, nullable | Party or facilitator ID; null only for system |
| `source` | enum | `facilitator_ui`, `party_ui`, `application_server`, `room_server`, `retention_job`, `admin_correction` |
| `occurred_at` | timestamptz | Time action occurred |
| `recorded_at` | timestamptz | Time line committed |
| `idempotency_key` | text, nullable | Required for retryable automated or external actions |
| `schema_version` | smallint | Payload schema version |
| `initial_visibility` | enum | `facilitator_only`, `party_visible` |
| `previous_line_hash` | text, nullable | Prior session line hash |
| `line_hash` | text | Hash of immutable line representation |

Ledger lines are insert-only until purge.

The original line is never changed to alter party visibility. Visibility changes are represented by separate ledger lines.

## 8. LedgerRoot

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `session_id` | UUID | Foreign key to session |
| `last_sequence_number` | bigint | Last line covered |
| `last_line_hash` | text | Chain root at signing time |
| `reason` | enum | `session_closed`, `pre_purge`, `destruction_attestation`, `integrity_checkpoint` |
| `signed_at` | timestamptz | |
| `signature_algorithm` | text | Approved algorithm identifier |
| `key_reference` | text | External KMS signing-key reference |
| `signature` | text | Detached signature |

Ledger roots contain no ledger payloads and no speech.

## 9. JointMinute

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `session_id` | UUID | Foreign key to session |
| `content` | encrypted text, nullable | Facilitator-authored content |
| `content_digest` | text, nullable | Digest of current content |
| `status` | enum | `draft`, `published`, `wiped` |
| `initialed_by` | UUID[] | Party IDs; process action only |
| `last_exported_at` | timestamptz, nullable | |
| `wiped_at` | timestamptz, nullable | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Avelis never retains an exported PDF or Markdown artifact.

## 10. DestructionReceipt

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `session_id` | UUID | Session identifier retained after purge |
| `organization_id` | UUID | Authorization and host scope |
| `purged_at` | timestamptz | Completed destruction time |
| `retention_window` | text | For example, `72 hours from close` |
| `bodies_destroyed` | text[] | Destroyed entity categories |
| `final_sequence_number` | bigint | Final process-ledger sequence |
| `ledger_root_hash` | text | Final ledger-chain hash |
| `destruction_manifest_digest` | text | Digest of deletion manifest |
| `attested_by_kind` | enum | Normally `system` |
| `signature` | text | Host-scoped destruction attestation |
| `created_at` | timestamptz | |

A destruction receipt must not contain ledger payloads, minute content, party contact data, invite material, or speech-derived material.

## 11. Non-entities

| Concept | Persistence rule |
|---|---|
| Room messages | Never persisted |
| Audio frames | Never persisted |
| Transcripts | Never generated |
| Room scrollback after close | Never available |
| Caucus content | Never persisted |
| Party profile | Does not exist |
| Cross-session party directory | Does not exist |
| AI output | Does not exist in product data |
| File attachment body | Not supported in MVP |
| Participant analytics | Not collected |
| Device, IP, browser, or location history | Not included in process ledger |

## 12. Retention rules

| Entity | Retention |
|---|---|
| Session metadata | Destroy at session retention expiry |
| Party | Destroy at session retention expiry |
| AgendaItem | Destroy at session retention expiry |
| LedgerLine | Destroy at session retention expiry |
| LedgerRoot | Destroy at session retention expiry |
| JointMinute content | Destroy at expiry or wipe earlier |
| DestructionReceipt | Retain indefinitely unless host policy says otherwise |
| Restricted security audit event | Default 30 days; maximum 90 days |
| Room and caucus memory | Destroy at room termination |

## 13. Required indexes

```sql
CREATE UNIQUE INDEX uq_ledger_session_sequence
  ON ledger_lines (session_id, sequence_number);

CREATE UNIQUE INDEX uq_ledger_session_idempotency
  ON ledger_lines (session_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_sessions_facilitator_status
  ON sessions (facilitator_id, status);

CREATE INDEX idx_sessions_org_status
  ON sessions (organization_id, status);

CREATE INDEX idx_sessions_retention_expiry
  ON sessions (retention_expires_at)
  WHERE status = 'closed';

CREATE INDEX idx_parties_session
  ON parties (session_id);

CREATE INDEX idx_agenda_session_order
  ON agenda_items (session_id, sort_order);

CREATE INDEX idx_ledger_session_sequence_read
  ON ledger_lines (session_id, sequence_number);

CREATE INDEX idx_ledger_roots_session
  ON ledger_roots (session_id, signed_at);

CREATE UNIQUE INDEX uq_destruction_receipt_session
  ON destruction_receipts (session_id);
```

## 14. Database constraints

The normal application role may insert and read active ledger rows but may not update or delete individual rows.

Only the narrowly scoped purge role may delete session-scoped retained data, and only when a session is eligible for purge.

Database triggers or equivalent policy controls must reject updates and individual deletes of active ledger rows.	