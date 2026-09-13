# Avelis

> A facilitator operating system for dialogues that must not leave a transcript.

Avelis keeps a bounded **process ledger** for a facilitated session and destroys live-room speech. The room is ephemeral. The joint minute is optional. No transcript is created.

The product object is a **session**. It is not a community, case-management system, social graph, participant directory, or general-purpose chat application.

## Core promise

- Text messages exist in memory only while a room is open (deliver-and-drop; no server scrollback).
- Audio, when enabled, is intended to move peer-to-peer through WebRTC and is never recorded (optional; gated until speech-safety verification).
- Avelis never generates a transcript.
- Avelis does not use AI to interpret, summarize, classify, or write process records.
- The ledger records authorized process facts, not speech or inference.
- A session's retained data is destroyed at the configured retention deadline.
- A destruction receipt remains as the limited evidence that destruction occurred.

## Repository status (honest)

**Maturity 9.5/10** - MVP Definition section 3 DoD substantially closed (maturity PR #6). **Premium 2026** visual system shipped onto main (tokens, premium overrides, facilitator/auth/session/room UI, protocol mark, visual-system + demo-script docs). Residual to 10/10: remove tracked node_modules/dist via shallow-clone cleanup, optional live-DB E2E under DATABASE_URL, and NAT/VPC endpoints before terraform apply.

See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for the live audit and residual list.

### What works here

- Ephemeral WebSocket room (HMAC party tokens only; raw shared secret rejected; no message history)
- Session create -> open -> invite -> close -> retention purge + verifiable destruction receipt
- Security audit retention purge (30d default / 90d max)
- Closed-vocabulary ledger append with transactional sequencing and hash chaining
- Facilitator sign-in, session console (keyboard-complete + factual empty states), party join, live room UI
- **Premium 2026** institutional UI (warm paper / near-black canvas, desaturated teal accent, Google-free system type, protocol mark — not lock/shield)
- Agenda + joint minute API surfaces; KMS factory (local | wired aws via @aws-sdk/client-kms)
- /healthz, /readyz, /metrics; content-capture flags refused in production
- docker compose for postgres + api + room (loopback ports; secrets via env file; migrations on API start)

### Still outstanding

- Operator shallow-clone: git rm -rf node_modules dist on tip if still tracked
- Apply CI workflow from docs/ci-workflow-phase3.yml (needs workflow scope) if pending
- Optional WebRTC audio only after speech-safety suite passes
- NAT gateway or VPC endpoints before private-subnet ECS apply

## What persists

| Data | Persists? | Retention |
|---|---:|---|
| Live room messages | No | Memory-only; released after delivery; destroyed on room teardown |
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

- A chat app or persistent messaging system
- A social network, participant directory, or relationship graph
- A therapy product, HR case-management tool, whistleblowing hotline, or mediation CRM
- A surveillance archive, recording system, or compliance archive for speech
- An AI assistant, transcription, summarization, or sentiment-analysis product
- A system of record for what participants said
- A legal-signature, legal-hold, or legal-discovery platform

Avelis does **not** claim legal privilege, subpoena immunity, or confidentiality beyond implemented technical controls. See the [Language Guide](docs/language-guide.md).

## Quick start

```bash
cp .env.compose.example .env   # set JWT_SECRET, ROOM_SHARED_SECRET, LOCAL_DEV_* keys
docker compose up --build
# API 127.0.0.1:3001  Room 127.0.0.1:3002  Postgres 127.0.0.1:5432

npm run test:speech-safety
npm run test:ledger
npm run test:retention
npm run test:room-auth
npm run test:integration
```

Dev without full compose (Postgres required):

```bash
cp .env.example.txt .env
npm install
npm run dev   # Vite + API + room
```

## Stack

- **UI:** Vite + React + TanStack Router
- **API:** Express (session lifecycle, ledger, invites, minute, agenda)
- **Room:** separate memory-only WebSocket process
- **DB:** PostgreSQL 16 + Drizzle ORM
- **Auth:** Argon2id passwords + HMAC facilitator JWT (party invite codes hashed)
- **Crypto:** AES-GCM helpers; KMS factory (local | aws with @aws-sdk/client-kms)
- **Tests:** Vitest (speech-safety, ledger, retention, room-auth, integration); Playwright smoke optional

## Documentation

| Document | Purpose |
|---|---|
| [Product Instruction](docs/product-instructions.md) | Binding product constitution |
| [Architecture](docs/architecture.md) | Durable and ephemeral system design |
| [Data Model](docs/data-model.md) | Entities, relationships, encryption, and retention |
| [Ledger Spec](docs/ledger-spec.md) | Closed process-ledger vocabulary and validation rules |
| [Session Lifecycle](docs/session-lifecycle.md) | State machine and destruction sequence |
| [Security & Threat Model](docs/security-threat-model.md) | Privacy, security, and non-persistence controls |
| [MVP Definition](docs/mvp-definition.md) | Must-ship and must-not-ship scope |
| [Testing Strategy](docs/testing-strategy.md) | Required safety, integrity, and lifecycle tests |
| [Deployment](docs/deployment.md) | Environments, secrets, backups, monitoring, and operations |
| [Backup & restore](docs/backup-restore.md) | Purge-aware backup policy |
| [Build Order](docs/build-order.md) | Dependency-aware implementation sequence |
| [Language Guide](docs/language-guide.md) | Approved and prohibited product language |
| [Visual System](docs/visual-system.md) | Interface principles and visual constraints (Premium 2026) |
| [Demo script](docs/demo-script.md) | Factual investor walkthrough |
| [ADRs](docs/adr/) | Binding technical decisions |
| [Contributing](CONTRIBUTING.md) | Change-control and review requirements |
| [Production readiness](PRODUCTION_READINESS.md) | Live maturity audit |

The Product Instruction governs all features, documentation, implementation, and operational decisions. If a change conflicts with it, the change is wrong.

## License

Proprietary. All rights reserved.
