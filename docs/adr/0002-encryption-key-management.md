# ADR-0002: Use host-scoped external KMS keys

## Status

Accepted

## Context

Avelis retains limited process data temporarily and must isolate host organizations. Encryption keys stored in the application database would weaken that boundary.

## Decision

Use an external KMS or equivalent secure key-management service.

Each organization receives:

- An encryption-key reference for persisted session bodies.
- A signing-key reference for ledger-root and destruction-receipt attestation.

Private key material does not enter PostgreSQL.

## Consequences

- KMS availability becomes a dependency for sensitive reads and writes.
- Key rotation requires a re-encryption strategy for retained data.
- KMS failures must fail safely and be handled by retention retry procedures.

## Compliance

This supports host-scoped isolation, encrypted persistence, and tamper-evident destruction proof.