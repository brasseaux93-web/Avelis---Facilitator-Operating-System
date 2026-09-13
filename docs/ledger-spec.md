# Ledger Specification

> The Avelis ledger records authorized process facts. It does not record speech, inference, participant behavior, or narrative case history.

## 1. Scope

The ledger is a temporary, append-only, session-scoped record.

It answers only:

- What authorized process action occurred?
- Which session object did it concern?
- Who or what performed it?
- In what canonical order was it recorded?
- What was the closed-schema result?
- Was the retained session material later destroyed?

The ledger must not answer what anyone said, meant, felt, intended, believed, or did outside the defined process action.

## 2. General line requirements

Every line must:

- Belong to exactly one session
- Use a closed `line_type`
- Pass the exact payload schema for that type
- Have an authorized actor and source
- Receive a transactional, per-session sequence number
- Be idempotent when triggered by retryable or external operations
- Be hash-chained to the prior line
- Be encrypted at rest
- Remain immutable until session purge

Every payload schema rejects unknown properties.

## 3. Forbidden payload content

No ledger payload may contain:

- Room message text
- Audio content
- Quotes, summaries, paraphrases, or descriptions of statements
- Free-form facilitator notes
- Sentiment, emotion, intent, credibility, willingness, or risk assessment
- Email address, telephone number, invite URL, raw invite code, or provider message ID
- IP address, device identifier, user agent, browser fingerprint, or location
- Message count, typing state, read state, reaction, speaking duration, mute state, or participant analytics
- Exported file bytes, path, URL, recipient list, or minute body
- AI output or AI-generated classification

## 4. Closed vocabulary

### Session lifecycle

| Type | Actor | Payload |
|---|---|---|
| `session_opened` | facilitator | `{}` |
| `session_closed` | facilitator | `{}` |
| `session_close_failed` | system | `{ "reason_code": "room_termination_failed" \| "state_conflict" \| "authorization_failed" }` |
| `room_destroyed` | system | `{ "destruction_method": "process_terminated" \| "memory_cleared", "result": "completed" \| "failed" }` |

### Invitations and access

| Type | Actor | Payload |
|---|---|---|
| `invite_created` | facilitator | `{ "party_id": "UUID", "delivery_channel": "email" \| "copy_link" }` |
| `invite_sent` | system | `{ "party_id": "UUID", "delivery_channel": "email" \| "copy_link", "result": "sent" }` |
| `invite_delivery_failed` | system | `{ "party_id": "UUID", "delivery_channel": "email" \| "copy_link", "reason_code": "provider_rejected" \| "delivery_unavailable" \| "delivery_timeout" }` |
| `invite_revoked` | facilitator | `{ "party_id": "UUID" }` |
| `party_joined` | party or system | `{ "party_id": "UUID", "identity_class": "named" \| "role_only" \| "affiliation_only" \| "unnamed" }` |
| `party_declined` | party or system | `{ "party_id": "UUID" }` |
| `party_left` | party or system | `{ "party_id": "UUID" }` |
| `party_access_revoked` | system | `{ "party_id": "UUID", "reason_code": "session_closed" \| "invite_revoked" \| "facilitator_removed" \| "session_purged" }` |

### Identity class

| Type | Actor | Payload |
|---|---|---|
| `identity_class_set` | party or facilitator | `{ "party_id": "UUID", "identity_class": "named" \| "role_only" \| "affiliation_only" \| "unnamed" }` |
| `identity_class_corrected` | facilitator | `{ "party_id": "UUID", "from_identity_class": "named" \| "role_only" \| "affiliation_only" \| "unnamed", "to_identity_class": "named" \| "role_only" \| "affiliation_only" \| "unnamed" }` |

`identity_class_corrected` is allowed only before session open.

### Agenda

| Type | Actor | Payload |
|---|---|---|
| `agenda_item_tabled` | facilitator | `{ "item_id": "UUID" }` |
| `agenda_item_reordered` | facilitator | `{ "item_id": "UUID", "from_sort_order": "integer", "to_sort_order": "integer" }` |
| `agenda_item_marked` | facilitator | `{ "item_id": "UUID", "mark": "agreed" \| "parked" \| "refused" }` |

### Caucus boundaries

| Type | Actor | Payload |
|---|---|---|
| `caucus_opened` | facilitator | `{ "caucus_id": "UUID" }` |
| `caucus_closed` | facilitator or system | `{ "caucus_id": "UUID" }` |
| `caucus_access_changed` | facilitator | `{ "caucus_id": "UUID", "party_id": "UUID", "action": "added" \| "removed" }` |

Caucus participant membership remains facilitator-only. A party-visible caucus boundary may state only that a caucus was opened or closed; it must not reveal membership.

### Process marks

| Type | Actor | Payload |
|---|---|---|
| `process_mark_recorded` | facilitator | `{ "mark": "pause_called" \| "return_to_plenary" \| "process_complete" }` |

### Ledger visibility

| Type | Actor | Payload |
|---|---|---|
| `ledger_line_published` | facilitator | `{ "target_line_id": "UUID" }` |
| `ledger_line_withdrawn_from_party_view` | facilitator | `{ "target_line_id": "UUID" }` |

A visibility action is facilitator-only. It never modifies the target line.

### Joint minute

| Type | Actor | Payload |
|---|---|---|
| `joint_minute_created` | facilitator | `{ "minute_id": "UUID" }` |
| `joint_minute_published` | facilitator | `{ "minute_id": "UUID", "content_digest": "hex_digest" }` |
| `joint_minute_initialed` | party | `{ "minute_id": "UUID", "party_id": "UUID", "content_digest": "hex_digest" }` |
| `joint_minute_exported` | facilitator | `{ "minute_id": "UUID", "format": "pdf" \| "markdown", "content_digest": "hex_digest" }` |
| `joint_minute_wiped` | facilitator or system | `{ "minute_id": "UUID", "result": "completed" \| "failed" }` |

### Retention and destruction

| Type | Actor | Payload |
|---|---|---|
| `retention_window_set` | facilitator | `{ "retention_hours": "integer" }` |
| `purge_started` | system | `{ "retention_expires_at": "timestamptz" }` |
| `purge_completed` | system | `{ "destruction_manifest_digest": "hex_digest", "result": "completed" }` |
| `purge_failed` | system | `{ "reason_code": "database_unavailable" \| "key_unavailable" \| "deletion_failed" \| "verification_failed" }` |
| `destruction_attested` | system | `{ "receipt_id": "UUID", "purged_at": "timestamptz", "retention_window": "string", "bodies_destroyed": ["ledger_lines" \| "joint_minute" \| "agenda_items" \| "parties" \| "session_metadata"], "ledger_root_hash": "hex_digest", "destruction_manifest_digest": "hex_digest" }` |

## 5. Visibility rules

The effective visibility of a target line is calculated from:

1. The line's `initial_visibility`
2. Later valid publication or withdrawal events targeting that line
3. The current sequence position

No security, invitation-delivery, retention, purge, integrity, or destruction-detail line is eligible for party visibility.

Caucus access membership is never party-visible to other parties.

## 6. Integrity rules

Each line has:

```text
payload_digest
previous_line_hash
line_hash
```

The payload is canonically serialized before hashing. The canonical serialization algorithm, hash algorithm, and signature algorithm must be fixed in an ADR and versioned.

The line hash covers immutable metadata, the payload digest, and the preceding line hash.

At session close and immediately before purge, Avelis signs a ledger root using a host-scoped signing key held outside the database.

## 7. Corrections

Ledger lines are never edited.

A process change is represented by another closed-vocabulary line. Examples:

- A new agenda status is another `agenda_item_marked` line.
- A visibility change is a visibility event.
- A pre-open identity correction is `identity_class_corrected`.

No generic free-text correction type exists.

## 8. Forbidden line types

The following are expressly prohibited:

```text
message_sent
message_deleted
message_edited
message_read
message_counted
typing_started
typing_stopped
reaction_added
audio_started
audio_stopped
speaker_time_recorded
mute_changed
sentiment_detected
participant_note_added
facilitator_observation
position_summarized
issue_interpreted
risk_score_assigned
outcome_predicted
ai_summary_generated
transcript_created
recording_created
participant_profile_updated
location_recorded
device_recorded
ip_address_recorded
session_analytics_recorded
```

## 9. Change control

Adding, removing, renaming, or widening a line type requires:

1. Product Instruction amendment
2. ADR
3. Strict payload schema
4. Explicit actor and visibility policy
5. Retention analysis
6. Threat-model review
7. Tests proving that the payload cannot contain prohibited content