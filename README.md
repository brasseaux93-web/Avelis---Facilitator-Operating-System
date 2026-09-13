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

**Maturity 9.5/10** — MVP DoD closed on `main` (PR #6); this PR lands Premium 2026 visual/demo polish. Residual for a full 10: remove tracked `node_modules`/`dist`, optional live-DB E2E, NAT/VPC before terraform apply.

See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).

### What works here

- Ephemeral WebSocket room (HMAC party tokens only; raw shared secret rejected; no message history)
- Session create → open → invite → close → retention purge + verifiable destruction receipt
- Security audit retention purge; content-safe observability
- Closed-vocabulary ledger append with transactional sequencing and hash chaining
- Facilitator sign-in, session console, party join, live room UI
- Agenda + joint minute APIs; KMS factory (`local` | `aws` via `@aws-sdk/client-kms`)
- `/healthz`, `/readyz`, `/metrics`; `docker compose` with migrations on API start
- **Premium 2026 UI** — institutional tokens, protocol mark, protocol-stream room, demo script ([Visual System](docs/visual-system.md), [demo script](docs/demo-script.md))

### Still outstanding

- Operator: `git rm -rf node_modules dist` if still tracked (`scripts/remove-tracked-node-modules.md`)
- Apply CI from `docs/ci-workflow-phase3.yml` if pending (`workflow` scope)
- Optional WebRTC only after speech-safety suite passes
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

npm run test:speech-safety && npm run test:ledger && npm run test:retention
npm run test:room-auth && npm run test:integration
```

Investor walkthrough: [docs/demo-script.md](docs/demo-script.md).

## Stack

- **UI:** Vite + React + TanStack Router (Premium 2026 tokens)
- **API:** Express · **Room:** memory-only WebSocket · **DB:** PostgreSQL 16 + Drizzle
- **Auth:** Argon2id + HMAC JWT · **Crypto:** AES-GCM + KMS factory
- **Tests:** Vitest suites above; Playwright smoke optional

## Documentation

| Document | Purpose |
|---|---|
| [Product Instruction](docs/product-instructions.md) | Binding product constitution |
| [Architecture](docs/architecture.md) | System design |
| [MVP Definition](docs/mvp-definition.md) | Must-ship scope |
| [Language Guide](docs/language-guide.md) | Approved wording |
| [Visual System](docs/visual-system.md) | Tokens + §11 constraints |
| [Demo script](docs/demo-script.md) | 5-minute investor path |
| [Deployment](docs/deployment.md) | Ops |
| [Production readiness](PRODUCTION_READINESS.md) | Live audit |
| [ADRs](docs/adr/) | Technical decisions |
| [Contributing](CONTRIBUTING.md) | Change control |

## License

Proprietary. All rights reserved.
