# MVP Definition

> Build this, nothing else.

## 1. Must ship

### Session management

- Create a session with a process title.
- Set retention in draft state: default 72 hours, range 0–720 hours.
- Open a session.
- Close a session.
- Calculate retention deadline at close.
- Purge session-scoped retained data at expiry.
- Create a destruction receipt.

### Invitations and identity

- Create invite link and one-time code.
- Deliver invitation by email, or a copy-link when mail is not configured.
- Store only invite-code hash.
- Rate-limit code attempts.
- Allow invite revoke.
- Allow party join, decline, and leave.
- Present identity-class selection at join.
- Allow facilitator pre-assignment and pre-open correction only.
- Revoke party access at close.

### Live room

- Ephemeral text messaging.
- Memory-only room server.
- No persistence, transcript, scrollback after close, recording, export, reaction, read receipt, or typing history.
- Optional WebRTC mesh audio only after stable speech-safety verification.

### Agenda

- Table agenda items.
- Reorder agenda items.
- Mark agenda items `agreed`, `parked`, or `refused`.
- Write corresponding process-ledger lines.

### Process ledger

- Closed line vocabulary.
- Strict server-side payload validation.
- Append-only insert-only storage.
- Transactional per-session sequencing.
- Hash chain and signed roots at close and purge.
- Party-visible publication and withdrawal events.
- Facilitator-only access to restricted operational lines.
- Ledger verification before destruction attestation.

### Joint minute

- Facilitator-authored plain-text editor.
- Publish minute to parties.
- Party initial against content digest.
- Export PDF.
- Export Markdown.
- Do not retain exported file.
- Wipe minute content early.
- Destroy minute content at retention expiry.

### Safety and operations

- Host-scoped encryption keys.
- KMS-backed production key management.
- Bounded backups and purge-aware restore procedure.
- Minimal non-content observability.
- Restricted security audit record with 30-day default retention.
- Keyboard-complete critical flows.
- Factual empty states explaining non-persistence.

## 2. Must not ship

| Forbidden feature | Reason |
|---|---|
| Speech-to-model, transcription, summarization, or sentiment analysis | Speech and inference boundary |
| Persistent party accounts | Session-scoped identity only |
| Chat history or scrollback after close | Speech must be gone |
| Audio recording or replay | Audio must not persist |
| Read receipts, reactions, typing presence history | Behavioral telemetry |
| Participant directory or cross-session contacts | No social graph |
| Facilitator notes about people or statements | Interpretation and speech-adjacent persistence |
| Attachments or file-body storage | Not needed for MVP; expands persistence surface |
| Integrations with messaging, CRM, HR, or collaboration platforms | External persistence and scope expansion |
| Analytics dashboards | Creates behavioral archive pressure |
| Public session feed or discovery | Avelis is not a community |
| Mobile native applications | Web-first solo-founder constraint |
| Legal hold or e-discovery functions | Conflicts with bounded destruction model |
| Data warehouse or product analytics export | Creates shadow retention surface |

## 3. Definition of done

The MVP is not done until:

- Speech-safety tests pass.
- Log, cache, database, and backup-boundary tests pass.
- Ledger schema and hash-chain tests pass.
- Retention and destruction tests pass.
- A complete create → invite → join → room → agenda → minute → close → purge flow passes end to end.
- A destruction receipt is verifiable after purge.
- No production dependency receives session content.
- Documentation, ADRs, and environment configuration match the implementation.