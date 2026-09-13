# Architecture

> Avelis separates ephemeral speech delivery from bounded process persistence.

## 1. Design principles

1. Speech is memory-only.
2. The process ledger is the only durable session record aside from the optional joint minute and final destruction receipt.
3. The ledger is append-only, ordered, encrypted, and tamper-evident.
4. Signaling carries control events, not speech.
5. No model is in the critical path for session *speech*. A facilitator process copilot may rank next process actions from a speech-free ledger snapshot; it never writes the ledger.
6. Host organizations are isolated encryption scopes.
7. Retention and destruction are first-class system behavior, not cleanup.

## 2. System components

| Component | Role | May persist speech? |
|---|---|---:|
| Browser client | Displays room and process UI | No |
| Application server | Authentication, session control, agenda, ledger, minute, export | No |
| Room server | Memory-only text delivery and runtime room state | No |
| Signaling service | WebRTC and session-control signaling | No |
| WebRTC mesh | Peer-to-peer audio transport | No |
| PostgreSQL | Bounded process data | No |
| External KMS | Encryption and signing key operations | No |
| Retention worker | Verifies and destroys eligible session data | No |
| Restricted security audit store | Minimal operational security events | No |
| Process copilot | Ranks next closed-vocabulary actions from process facts | No |

## 3. Topology

```text
Facilitator browser                 Party browser
        │                                  │
        ├──────── HTTP / TLS ──────────────┤
        │                                  │
        ▼                                  ▼
                 Application server
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      PostgreSQL   Room server   Signaling
      bounded      RAM-only      control-only
      process         │             │
      data            │             │
                      └──── WebRTC ─┘
                         peer-to-peer audio

Application server / retention worker
        │
        ▼
External KMS for host-scoped encryption and signing
```

## 4. Live-room data flow

```text
Party sends text
  → authenticated WebSocket to room server
  → message exists in RAM only
  → message delivered to connected room clients
  → server releases message buffer
  → no database write
  → no log body
  → no queue, analytics, backup, or object-storage write
```

Browser clients must not persist room text in:

- Local storage
- Session storage
- IndexedDB
- Cache Storage
- Service-worker caches
- Download history
- Error-reporting breadcrumbs
- Analytics events

The room server must not write room content to disk, logs, crash dumps, or diagnostic snapshots.

## 5. Audio data flow

Audio uses WebRTC mesh.

- Audio is protected in transit by DTLS-SRTP.
- No media-recording component exists.
- No selective forwarding unit is used in MVP.
- No server-side audio frame, recording, transcript, or audio analytics is persisted.
- Audio is optional in MVP and must remain disabled until stable non-recording operation is verified.

## 6. Control and signaling

The signaling channel carries only:

```text
join
leave
session_open
session_close
caucus_open
caucus_close
caucus_access_change
identity_class_set
room_access_revoked
```

It must not carry room messages, audio frames, minute content, or arbitrary participant metadata.

The application server translates authorized process actions into validated ledger inserts. The client never writes ledger rows directly.

## 7. Persistence boundary

PostgreSQL may store:

- Organizations
- Facilitator accounts
- Sessions
- Parties and invite hashes
- Agenda items
- Process ledger lines
- Ledger roots
- Optional joint-minute content
- Destruction receipts

PostgreSQL must not store:

- Room text
- Audio
- Transcripts
- Speech-derived summaries or inferences
- Participant behavioral telemetry
- Recoverable session-content exports

## 8. Ledger write path

```text
Authorized action
  → server-side authorization
  → session-state validation
  → closed line-type validation
  → exact payload-schema validation
  → transactional sequence allocation
  → canonical payload encoding
  → payload digest and hash-chain calculation
  → encrypted append-only insert
  → optional party-visible event delivery
```

The transaction must reject duplicate sequence numbers and duplicate idempotency keys.

## 9. Encryption and signing

### At rest

- Persisted session bodies use AES-256-GCM or an approved authenticated-encryption equivalent.
- Each organization uses host-scoped KMS-managed encryption keys.
- Key material is not stored in PostgreSQL.
- Encryption contexts bind ciphertext to organization and entity scope.

### Integrity signing

- Ledger roots are signed with a host-scoped KMS-backed signing key.
- The signature key is distinct from the encryption key where supported.
- Ledger-root verification occurs at close and before purge.
- A destruction receipt carries the final root reference and attestation signature.

### In transit

- HTTP and WebSocket use TLS 1.2 or higher.
- WebRTC uses DTLS-SRTP.
- Mixed content is prohibited.

## 10. Retention worker

The retention worker:

1. Finds closed sessions whose retention deadline has passed.
2. Locks the session for a single purge attempt.
3. Verifies ledger integrity.
4. Creates a final ledger root.
5. Records purge initiation.
6. Destroys all session-scoped retained records.
7. Writes the destruction receipt.
8. Emits minimal non-speech operational telemetry.
9. Retries failures safely and alerts authorized operators.

The worker must never export session data to a queue, data warehouse, analytics system, or backup as part of verification or purge.

## 11. Backups and replicas

Backups are part of the persistence boundary.

- Backup retention must not exceed the maximum session retention window plus the bounded operational recovery interval.
- Backup restoration procedures must reapply purge obligations before restored data becomes accessible.
- Replicas must use the same encryption and retention controls.
- Production data must not be copied into development, test, analytics, support, or demo environments.
- Destruction verification must include backup and replica policy verification.

## 12. Authorization

| Action | Facilitator | Party | System |
|---|---:|---:|---:|
| Create or open session | Yes | No | No |
| Invite party | Yes | No | No |
| Join session | No | Yes | No |
| Send live-room text | Yes | Yes | No |
| Author ledger line | Defined types only | Defined types only | Defined types only |
| Publish ledger line | Yes | No | No |
| Manage agenda | Yes | No | No |
| Open or close caucus | Yes | No | No |
| Draft/export/wipe minute | Yes | No | No |
| Initial minute | No | Yes | No |
| Purge session | No | No | Yes |
| Attest destruction | No | No | Yes |

## 13. Operational observability

Observability must collect health, not content.

Allowed examples:

- Service uptime
- Process restart count
- Request latency
- Database connection health
- Queue depth where queues contain no session content
- Aggregate error-class count
- Retention-job success or failure count

Forbidden examples:

- Request bodies
- WebSocket message bodies
- Room message length or count per session
- Per-party behavioral metrics
- Raw exception objects containing session fields
- Session-content sampling
- Replay tools that capture UI state or text