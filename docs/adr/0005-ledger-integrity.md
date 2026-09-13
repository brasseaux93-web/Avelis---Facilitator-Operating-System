# ADR-0005: Make the process ledger tamper-evident

## Status

Accepted

## Context

An application-level claim that a ledger is append-only does not reveal privileged database alteration, deletion, insertion, or reordering.

## Decision

Each session ledger uses:

- Transactional monotonically increasing sequence numbers
- Strict line-type and payload schemas
- Canonical payload serialization
- Payload digest
- Previous-line hash
- Line hash
- KMS-backed signed ledger roots at close and before purge

Normal application roles cannot update or delete ledger rows.

## Consequences

- The ledger model and migration complexity increase.
- Canonical serialization must be versioned and tested.
- Verification becomes mandatory before destruction attestation.

## Compliance

This makes the retained process record materially consistent with Avelis’s integrity claims without retaining conversation content.