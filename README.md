# Avelis

> A facilitator operating system for dialogues that must not leave a transcript.

Avelis keeps a bounded **process ledger** for a facilitated session and destroys live-room speech. The room is ephemeral. The joint minute is optional. No transcript is created.

Avelis is for multi-track dialogue, organizational ombuds work, workplace or campus facilitated conversations, Track 1.5 and Track II rounds, and small ADR panels where participants need a usable process record without creating a recoverable record of the conversation.

The product object is a **session**. It is not a community, case-management system, social graph, participant directory, or general-purpose chat application.

## Core promise

- Text messages exist in memory only while a room is open.
- Audio moves peer-to-peer through WebRTC and is never recorded.
- Avelis never generates a transcript.
- Avelis does not use AI to interpret, summarize, classify, or write process records.
- The ledger records authorized process facts, not speech or inference.
- A session's retained data is destroyed at the configured retention deadline.
- A destruction receipt remains as the limited evidence that destruction occurred.

## What persists

| Data | Persists? | Retention |
|---|---:|---|
| Live room messages | No | Memory-only; destroyed on delivery and room termination |
| Audio frames | No | Peer-to-peer; never recorded or stored |
| Transcript | No | Never created |
| Session metadata | Yes | Destroyed at session retention expiry |
| Process ledger | Yes | Destroyed at session retention expiry |
| Agenda process labels | Yes | Destroyed at session retention expiry |
| Party invite and identity-class records | Yes | Destroyed at session retention expiry |
| Joint-minute body | Optional | Destroyed at session retention expiry or wiped earlier |
| Destruction receipt | Yes | Retained indefinitely unless host policy specifies otherwise |
| Restricted security audit events | Yes, minimally | Default 30 days; maximum 90 days |

## What Avelis is not

Avelis is not:

- A chat app or persistent messaging system
- A social network, participant directory, or relationship graph
- A therapy product, HR case-management tool, whistleblowing hotline, or mediation CRM
- A surveillance archive, recording system, or compliance archive for speech
- An AI assistant, transcription system, summarization tool, or sentiment-analysis product
- A system of record for what participants said
- A legal-signature, legal-hold, or legal-discovery platform

## Documentation

| Document | Purpose |
|---|---|
| [Product Instruction](docs/product-instruction.md) | Binding product constitution |
| [Architecture](docs/architecture.md) | Durable and ephemeral system design |
| [Data Model](docs/data-model.md) | Entities, relationships, encryption, and retention |
| [Ledger Spec](docs/ledger-spec.md) | Closed process-ledger vocabulary and validation rules |
| [Session Lifecycle](docs/session-lifecycle.md) | State machine and destruction sequence |
| [Security & Threat Model](docs/security-threat-model.md) | Privacy, security, and non-persistence controls |
| [MVP Definition](docs/mvp-definition.md) | Must-ship and must-not-ship scope |
| [Testing Strategy](docs/testing-strategy.md) | Required safety, integrity, and lifecycle tests |
| [Deployment](docs/deployment.md) | Environments, secrets, backups, monitoring, and operations |
| [Build Order](docs/build-order.md) | Dependency-aware implementation sequence |
| [Language Guide](docs/language-guide.md) | Approved and prohibited product language |
| [Visual System](docs/visual-system.md) | Interface principles and visual constraints |
| [ADRs](docs/adr/) | Binding technical decisions |
| [Contributing](CONTRIBUTING.md) | Change-control and review requirements |

## Technology direction

- Full-stack application: TanStack Start or an equivalent TypeScript framework
- Ephemeral text room: WebSocket, memory-only
- Audio: WebRTC mesh, peer-to-peer, no recording server
- Persistence: PostgreSQL for bounded process data only
- Encryption: AES-256-GCM at rest with host-scoped keys
- Deployment: containerized single-VPS MVP with no session-content CDN or object storage

## Status

Pre-MVP. The Product Instruction governs all features, documentation, implementation, and operational decisions.

## License

Proprietary. All rights reserved.