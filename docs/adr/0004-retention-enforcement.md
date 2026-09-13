# ADR-0004: Enforce retention with a dedicated purge worker

## Status

Accepted

## Context

Avelis promises bounded retention and destruction. Passive expiry flags or manual deletion are insufficient.

## Decision

Use a dedicated retention worker that:

1. Finds eligible closed sessions.
2. Locks one session for purge.
3. Verifies the ledger hash chain.
4. Creates a final signed ledger root.
5. Deletes session-scoped retained entities.
6. Writes a destruction receipt.
7. Retries safely after failure.

## Consequences

- The retention worker requires narrowly scoped destructive database permission.
- Purge failure must block a success attestation.
- Backups and restore procedures must preserve the same retention obligations.

## Compliance

This implements the bounded-retention and destruction requirements of the Product Instruction.