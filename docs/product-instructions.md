# Product Instruction

> This document is the constitution of Avelis. If a feature, implementation detail, interface, metric, prompt, integration, or sentence conflicts with this document, it is wrong.

## 1. Product definition

Avelis is a facilitator operating system for **AI conflict resolution in private rooms**: a bounded session where participants need live text, a visible conflict agent, and no stored transcript.

Avelis stores a limited record of **process**. It does not store the conversation.

The product object is a session. A session has a beginning, an active room, a conflict agent, a close, a retention deadline, and destruction.

## 2. Governing promise

Avelis must preserve all of the following:

1. Speech is not persisted.
2. No transcript is created.
3. Audio is not recorded.
4. The ledger contains only closed-vocabulary process facts.
5. No model writes ledger lines. A visible conflict agent may see a rolling RAM window of the live room while it is open and may speak process questions. A facilitator-only process copilot may rank closed-vocabulary actions from process facts. The facilitator confirms every ledger line.
6. Participant identity is session-scoped and represented by a chosen identity class, not a profile.
7. Retained session data is destroyed at the selected retention deadline.
8. A destruction receipt is the only indefinite session-derived record.
9. Avelis does not create an undelete, archive, replay, scrollback, recording, or recovery path for speech.

## 3. Speech boundary

Speech includes:

- Text sent through the live room
- Audio spoken through the live room
- Transcripts, captions stored as history, or diarized audio
- Quotes, paraphrases, summaries, or descriptions of what a participant said
- Facilitator notes about participant statements
- Sentiment, intent, emotional state, credibility, preference, or risk inferences derived from speech
- Machine-generated descriptions or classifications of speech

Speech exists only in connected clients' volatile memory and the active room server's volatile memory long enough to deliver it. A rolling window of that same RAM may be sent to a configured inference provider for the conflict agent while the room is open. That path is disclosed to every party before they speak. It is not a transcript, not scrollback, and not stored by Avelis.

Speech must not be written to:

- PostgreSQL
- Filesystem storage
- Object storage
- Browser durable storage
- Application logs
- Error tracking payloads
- Analytics platforms
- Backups
- Queues
- Search indexes
- Test fixtures
- Support tools
- Third-party integrations, except the disclosed, session-scoped conflict-agent inference path in §12

## 4. Process ledger

The process ledger is the only durable session record other than optional joint-minute content and the final destruction receipt.

A ledger line may record only:

- Session lifecycle actions
- Invitation and access actions
- Identity-class actions
- Agenda actions
- Caucus boundaries and authorized access changes
- Closed-vocabulary process marks
- Party-visibility changes
- Joint-minute lifecycle actions
- Retention and destruction actions

The ledger is append-only, session-scoped, encrypted, ordered, tamper-evident, and destroyed at retention expiry.

No line may contain unrestricted narrative text, speech, inference, delivery addresses, invite codes, device metadata, location metadata, or behavioral telemetry.

## 5. Optional joint minute

The joint minute is an explicit and optional exception to the no-speech-persistence boundary.

It may contain facilitator-authored substantive text intended for participant review. It is not a transcript and must not be generated from room content by a model. A process copilot may propose an outline from already-marked agenda facts; the facilitator authors the minute.

The joint minute:

- Is written only by the facilitator
- May be published to parties for review
- May be initialed by parties as a process action, not a legal signature
- May be exported as PDF or Markdown
- Is never retained as an exported file by Avelis
- May be wiped early by the facilitator
- Is destroyed at session retention expiry if not wiped earlier

## 6. Identity and access

Parties do not create standing accounts.

A party joins one session using an invite link and one-time code. A party is represented only by a session-scoped identity class:

- `named`
- `role_only`
- `affiliation_only`
- `unnamed`

The identity class becomes immutable when the party joins. Before the session opens, a facilitator may correct a pre-assigned identity class.

Avelis must not expose a party directory, participant history, cross-session contact graph, profile, biography, avatar, or following relationship.

## 7. Retention and destruction

A facilitator selects retention while a session is in `draft`.

- Default: 72 hours from close
- Minimum: 0 hours
- Maximum: 720 hours, or 30 days
- The retention value becomes immutable when the session opens
- A value of `0` requires immediate purge after close

At close, Avelis destroys the active room and revokes party access.

At retention expiry, Avelis destroys all session-scoped retained data, including ledger lines, party records, agenda items, joint-minute content, and session metadata. A destruction receipt remains.

A retention extension after a session is opened is prohibited.

## 8. Privacy-first defaults

Avelis defaults to:

- Facilitator-only ledger visibility
- Minimal identity display
- No participant analytics
- No room telemetry retained per party
- No recording
- No speech-to-model path
- Optional facilitator process copilot (ledger-only; off the speech path)
- No third-party session-content integrations
- No durable browser cache for room content
- No social or cross-session features

A feature that creates more retained data than the minimum required for the process is presumed out of scope.

## 9. MVP scope

The MVP includes:

- Facilitator authentication
- Session creation, open, close, and destruction
- Email or SMS invitation delivery
- One-time party access
- Identity-class selection
- Ephemeral live text room
- Optional WebRTC mesh audio only if stable
- Agenda management
- Closed-vocabulary facilitator ledger
- Party-visible ledger publication
- Optional joint minute, initialing, PDF export, Markdown export, and wipe
- Retention enforcement
- Tamper-evident ledger verification
- Destruction receipt
- Facilitator process copilot (ledger-only context; never writes the ledger)

The MVP excludes:

- Speech-to-model paths, transcription, room summarization, or sentiment
- Persistent participant accounts
- Mobile native applications
- Third-party platform integrations
- File attachment bodies
- CRM functions
- Analytics dashboards
- Search across sessions
- Session templates that carry party data
- Recordings, transcripts, captions saved as history, or chat export
- Legal holds, litigation support, or e-discovery functions
- Public feeds, communities, directories, or social features

## 10. Product language

Avelis uses institutional, factual, clinical-neutral language.

The interface must state what it does and does not retain. It must not imply legal privilege, confidentiality guarantees beyond implemented controls, emotional care, therapy, reconciliation, safety, healing, trust, or peacebuilding outcomes.

See the Language Guide for approved wording.

## 11. Visual constraints

Avelis is operational software, not a social or advocacy brand.

The interface must not use:

- People or portrait illustrations
- Locks, shields, or surveillance imagery as reassurance decoration
- Doves, olive branches, globes, handshakes, or peace symbolism
- Speech bubbles, chat-transcript motifs, waveform histories, or audio-recording imagery
- Gamification, streaks, reactions, popularity indicators, or social counters

See the Visual System for implementation guidance.

## 12. Conflict agent and process copilot

Avelis may run a **visible conflict agent** in the live room.

The agent:

- Is disclosed to every party before they speak
- May receive a rolling RAM window of room text while the room is open
- Speaks as identity class `avelis`
- May whisper process notes to the facilitator only
- Must not write ledger lines, minutes, or destruction receipts
- Must follow `docs/agent-rules.md`
- Forgets the window when the room is torn down

Avelis still must not:

- Persist a transcript
- Transcribe audio
- Generate ledger lines
- Assess sentiment, toxicity, or risk of persons as a stored score
- Draft a joint minute from session speech
- Classify parties as profiles
- Train on session speech

A facilitator-only process copilot may still rank closed-vocabulary actions from a speech-free process snapshot.

Prompts and completions are memory-only: not logged by Avelis, not stored, not used for training by Avelis. The inference vendor (for example Groq) is a processor for the live window only. Parties must be told that inference is in the path.

This rule applies to first-party, third-party, embedded, hosted, local, and future model systems.

## 13. Data residency and encryption

Each organization is a host and one encryption scope.

Avelis must:

- Use host-scoped encryption keys for persisted session data
- Encrypt retained bodies at rest
- Use TLS for HTTP and WebSocket traffic
- Use DTLS-SRTP for WebRTC audio
- Keep production key material outside the database
- Respect configured regional deployment and residency constraints
- Avoid claims of jurisdiction-neutral operation

## 14. Enforcement hierarchy

When requirements conflict, apply this order:

1. No stored transcript or recording
2. Disclosed inference only; no silent listening
3. Retention and destruction guarantee
4. Closed process-ledger boundary
5. Host-scoped isolation
6. Session-scoped identity
7. Agent legal/tactical rules
8. Interface convenience

Convenience never creates an undelete path for speech.

## 15. Review requirement

Every proposed change must answer:

1. Does it create, derive, transmit, or retain speech?
2. Does it create a participant profile, behavioral record, or cross-session graph?
3. Does it broaden the ledger beyond the closed vocabulary?
4. Does it change retention, destruction, encryption, or access semantics?
5. Does it introduce a speech-to-model path, analytics, integration, or recovery path?
6. Does it require an amendment or ADR?

If the answer to any question is uncertain, the change must not proceed until reviewed.

## 16. Decision log

| Date | Decision | Status |
|---|---|---|
| 2026-09-10 | Session is the product object; speech is ephemeral; process may be retained temporarily | Accepted |
| 2026-09-12 | Ledger integrity through sequence ordering, hash chaining, and signed roots is MVP scope | Accepted |
| 2026-09-12 | Identity class becomes immutable at party join; retention becomes immutable at session open | Accepted |
| 2026-09-12 | Security audit data is separate from the process ledger and minimized by default | Accepted |
| 2026-09-13 | Facilitator process copilot (ledger-only) accepted; speech-to-model remains forbidden | Accepted |
| 2026-09-13 | Agent rules + facilitator process dialogue; Groq as optional inference backend | Accepted |
| 2026-09-13 | Visible conflict agent in the live room; disclosed RAM window to inference; still no stored transcript | Accepted |

## 17. Amendment process

Changes to this document require:

1. An issue titled `Amendment: [description]`
2. A precise explanation of the changed rule
3. A privacy and retention impact assessment
4. An implementation plan and test plan
5. An ADR when architecture, security, ledger, retention, or encryption changes
6. Explicit product-owner approval
7. An entry in the decision log
8. The merged amendment before implementation

Silent scope creep is a defect.