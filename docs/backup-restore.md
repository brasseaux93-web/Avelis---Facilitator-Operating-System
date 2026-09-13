# Backup and purge-aware restore checklist

> Backups must not resurrect speech or outlive session retention obligations.

## Policy

- Backup retention ≤ **max session retention** (720h) + **recovery window** (host-defined, typically ≤ 7 days).
- Do **not** copy production databases into development or shared staging that retains session bodies.
- Security audit events: default **30 days**, maximum **90 days** (ADR-0006).
- Destruction receipts may outlive session bodies; they must not contain speech or minute content.

## Pre-backup checklist

- [ ] Encryption at rest enabled on the database volume / RDS.
- [ ] Secrets (JWT, room secret, KMS) live in a secrets manager — not in the backup blob.
- [ ] Backup job does not scrape application logs that might contain identifiers beyond policy.
- [ ] Room process has **no durable volume** (memory-only).

## Purge-aware restore checklist

- [ ] Restore into an isolated recovery environment first.
- [ ] Before serving traffic: run retention destruction for all sessions past `retention_expires_at`.
- [ ] Confirm `destruction_receipts` and purged session scrub (`title=[PURGED]`, no ledger/minute/agenda/party rows).
- [ ] Confirm no prod→dev copy of session content.
- [ ] Run `npm run test:speech-safety` (or equivalent) against recovery.
- [ ] Record restore authorization (security audit event only — no bodies).

## Operator stub

See `scripts/purge-aware-restore.sh` (echoes steps; performs no writes).
