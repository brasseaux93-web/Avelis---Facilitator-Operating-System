# Session lifecycle

> Stub aligned to Product Instruction and architecture. Full state machine detail lives in code + ledger vocabulary.

## States

`draft` → `open` → `closed` → `purged`

- **draft** — facilitator prepares title, retention hours, invites; room not authoritative until open.
- **open** — parties may join; ephemeral room may run; process ledger appends authorized facts.
- **closed** — room destroyed; retention clock starts from `closed_at`; party access revoked.
- **purged** — session-scoped bodies destroyed; destruction receipt retained; title scrubbed.

## Destruction

At `retention_expires_at`, the retention job verifies the ledger hash chain (when lines exist), writes a signed destruction receipt, deletes ledger lines / minutes / agenda / parties, and marks the session purged.

Speech never enters the lifecycle store: room messages are memory-only and are not recoverable after room teardown.
