# Testing Strategy

> Safety properties are release gates, not aspirational tests.

## 1. Test layers

| Layer | Purpose |
|---|---|
| Unit | Validation, authorization, hashing, state transitions, retention calculations |
| Integration | Database permissions, encryption, room lifecycle, invite flow, export cleanup |
| End-to-end | Full facilitator and party workflows |
| Security regression | Non-persistence, logging, browser storage, dependency, and access-boundary checks |
| Operational verification | Retention-worker, backup-policy, KMS-failure, and destruction-receipt behavior |

## 2. Speech non-persistence tests

These tests are critical and must run on every merge.

- Send distinctive canary text through a live room.
- Verify the canary does not appear in PostgreSQL.
- Verify it does not appear in application logs, room logs, structured logs, error reports, or test artifacts.
- Verify it does not appear in browser local storage, session storage, IndexedDB, Cache Storage, service-worker caches, or download artifacts.
- Verify it does not appear in queues, temporary files, object-storage mocks, export buffers, metrics payloads, or analytics events.
- Close the room and verify no room scrollback endpoint exists.
- Restart the room server and verify the message cannot be recovered.
- Verify no transcript or caption persistence path exists.
- Verify audio test fixtures cannot be stored or exported by server code.

Use synthetic canary content only. Never use realistic private conversation content in test data.

## 3. Ledger integrity tests

- Reject unknown line types.
- Reject unknown payload fields.
- Reject payloads containing forbidden free text where not explicitly permitted.
- Reject unauthorized actor/type combinations.
- Reject invalid session-state transitions.
- Allocate unique increasing sequence numbers under concurrent writes.
- Reject duplicate idempotency keys.
- Confirm application database role cannot update or delete a ledger row.
- Verify hash-chain continuity.
- Verify payload digest against canonical payload encoding.
- Verify signed ledger roots at close and pre-purge.
- Detect a simulated altered, inserted, deleted, or reordered line.
- Confirm visibility changes append new lines and do not mutate target rows.
- Confirm parties cannot retrieve facilitator-only lines.

## 4. Retention and destruction tests

- Verify `retention_hours = 0` purges immediately after close.
- Verify configured retention deadline is calculated from `closed_at`.
- Verify retention cannot change after open.
- Verify eligible sessions are selected exactly once for purge.
- Verify all session-scoped entities are deleted.
- Verify joint-minute content is deleted on wipe and at purge.
- Verify party records and delivery addresses are deleted at purge.
- Verify destruction receipt remains.
- Verify receipt excludes speech, minute content, delivery addresses, invite codes, and ledger payload bodies.
- Simulate database failure, KMS failure, and deletion failure.
- Verify `purge_failed` is recorded where possible.
- Verify the system does not falsely attest successful destruction.
- Verify backup and restore procedures reapply purge obligations before restored data is accessible.

## 5. Access-control tests

- Party cannot access a session without valid one-time invite authorization.
- Used invite code cannot be reused.
- Revoked invite cannot be used.
- Party cannot access any other session.
- Party cannot access after close.
- Party cannot view facilitator-only ledger lines.
- Party cannot view caucus membership of another party.
- Facilitator cannot access another organization’s session.
- Purge role cannot delete an ineligible session.
- Normal application role cannot delete or update ledger rows.

## 6. Joint-minute tests

- Facilitator may draft and publish a minute.
- Party may initial the published content digest.
- Initial must reference the currently published digest.
- Export PDF and Markdown does not create a durable server artifact.
- Export failure clears temporary generation buffers.
- Wipe deletes minute content and changes status.
- Export after wipe fails factually.
- Minute body never appears in logs or analytics.

## 7. End-to-end acceptance flow

1. Facilitator creates draft session with 72-hour retention.
2. Facilitator creates party invite.
3. Party joins and selects identity class.
4. Facilitator opens session.
5. Parties exchange synthetic canary room messages.
6. Facilitator tables and marks agenda items.
7. Facilitator opens and closes a caucus.
8. Facilitator publishes an eligible ledger line.
9. Facilitator creates, publishes, and exports a joint minute.
10. Party initials the published minute.
11. Facilitator closes session.
12. Test confirms room destruction and access revocation.
13. Retention worker purges session.
14. Test verifies no canary, minute content, party delivery address, or ledger payload remains.
15. Test verifies destruction receipt and final signed ledger-root reference.

## 8. Release gates

A release is blocked by:

- Any failed speech non-persistence test
- Any ledger-integrity failure
- Any retention/destruction failure
- Any test showing room content in logs, caches, persistence, backups, or third-party telemetry
- Any new dependency that can capture session content without an approved review
- Any mismatch between implementation and Product Instruction