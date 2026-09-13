# Security and threat model

> Privacy controls emphasize non-persistence of speech, least privilege, and separated audit data (ADR-0006).

## Assets

- Ephemeral room speech (must not persist)
- Process ledger and joint-minute bodies (bounded retention)
- Facilitator credentials and room tokens
- Destruction receipts and security audit events

## Primary threats

| Threat | Mitigation direction |
|---|---|
| Logging or analytics capturing speech | Startup guards; structured logs without bodies; CI flag check |
| Room state on disk / swap | No room volume; `ROOM_SWAP_DISABLED`; memory limit |
| Weak room secret in production | Refuse start if secret missing/placeholder (including `change-me-room-secret-compose`) or too short |
| Raw shared secret used as `roomToken` | Rejected always; only HMAC(`sessionId:partyId`, secret) accepted |
| Backup resurrecting purged bodies | Purge-aware restore; backup retention ≤ session max + recovery window |
| Mixing security telemetry into party-visible ledger | Separate `security_audit_events` store with timed purge |
| Client-controlled `X-Request-ID` carrying emails | `sanitizeRequestId` regenerates when `@` / email-like |

## Explicit non-claims

This document does not assert legal privilege, absolute protection against a compromised host operator, or immunity from lawful process for data still within retention.
