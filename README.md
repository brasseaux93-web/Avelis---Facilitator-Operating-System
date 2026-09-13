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

**Maturity ~7/10** on this branch — constitution-grade docs, Phase 1–3 production-host foundations, plus **Premium 2026 visual / demo polish** (shipped here). Not yet a finished multi-tenant SaaS or fully hardened pilot.

Open production-readiness PRs (merge in order):

| PR | Branch | Focus |
|---|---|---|
| [#1](https://github.com/brasseaux93-web/Avelis---Facilitator-Operating-System/pull/1) | `prod-readiness/phase-1` | Speech-safe room, transactional ledger append, schema-aligned purge |
| [#2](https://github.com/brasseaux93-web/Avelis---Facilitator-Operating-System/pull/2) | `prod-readiness/phase-2` | Facilitator auth (Argon2 + JWT), invite redeem, session/agenda/minute APIs + UI spine, language-guide landing |
| [#3](https://github.com/brasseaux93-web/Avelis---Facilitator-Operating-System/pull/3) | `prod-readiness/phase-3` | KMS factory, health/metrics, Docker api/room, deployment/backup docs, security audit table, terraform expansion |
| (this) | `prod-readiness/premium-2026` | Premium 2026 visual system, facilitator density, investor demo script |

`main` still reflects the earlier pre-MVP tree until those PRs merge. Prefer reviewing/running from `prod-readiness/premium-2026` (or at least `phase-3`) for current code.

See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for the live audit on this branch.

### What works on this branch

- Ephemeral WebSocket room (authenticated tokens; no in-memory message history)
- Session create → open → invite → close → retention purge worker + destruction receipt path
- Closed-vocabulary ledger append with transactional sequencing and hash chaining
- Facilitator sign-in, session console, party join, live room UI routes
- Agenda + joint minute API surfaces; signed ledger roots (dev/local KMS)
- `/healthz`, `/readyz`, `/metrics`; content-capture flags refused in production
- `docker compose` for postgres + api + room
- **Premium 2026 UI** — institutional tokens (`src/styles/tokens.css`), protocol mark, facilitator empty states, protocol-stream room, language-guide disclosures ([Visual System](docs/visual-system.md), [demo script](docs/demo-script.md))

### Still outstanding

- Merge PRs #1–#3 (and this premium PR) into `main`
- Remove tracked `node_modules/` / `dist/` from git history (see `scripts/remove-tracked-node-modules.md` on phase-3)
- Apply CI workflow from `docs/ci-workflow-phase3.yml` (needs a token with `workflow` scope)
- Wire real AWS KMS credentials (stub provider present)
- Optional WebRTC audio only after speech-safety suite passes
- Green Playwright end-to-end path before enabling e2e in CI

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

## Quick start (`npm run dev`)

```bash
git fetch origin
git checkout prod-readiness/premium-2026
cp .env.example.txt .env   # set JWT_SECRET, ROOM_SHARED_SECRET, DATABASE_URL
docker compose up postgres -d
npm install
npm run dev   # Vite UI + API + room (concurrently)
```

Development auto-seeds a facilitator when missing (`facilitator@avelis.local` / `change-me-now`, or `FACILITATOR_SEED_*`). Sign in at `/auth`, then `/sessions`. Party join: `/join`.

Full stack:

```bash
docker compose up --build
# API :3001  Room :3002  Postgres :5432
# Health: GET /healthz  Ready: GET /readyz

npm run test:speech-safety
npm run test:ledger
npm run test:retention
```

Investor walkthrough: [docs/demo-script.md](docs/demo-script.md).

Use placeholder-only data. Never paste real conversation content into fixtures, logs, or issues.

## Stack

- **UI:** Vite + React + TanStack Router
- **API:** Express (session lifecycle, ledger, invites, minute, agenda)
- **Room:** separate memory-only WebSocket process
- **DB:** PostgreSQL 16 + Drizzle ORM
- **Auth:** Argon2id passwords + HMAC facilitator JWT (party invite codes hashed)
- **Crypto:** AES-GCM helpers; KMS factory (`local` | `aws` stub)
- **Tests:** Vitest (speech-safety, ledger, retention); Playwright e2e not yet a release gate

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
| [Visual System](docs/visual-system.md) | Tokens, type, forbidden imagery (§11) |
| [Demo script](docs/demo-script.md) | 5-minute investor walkthrough |
| [ADRs](docs/adr/) | Binding technical decisions |
| [Contributing](CONTRIBUTING.md) | Change-control and review requirements |
| [Production readiness](PRODUCTION_READINESS.md) | Live maturity audit |

The Product Instruction governs all features, documentation, implementation, and operational decisions. If a change conflicts with it, the change is wrong.

## License

Proprietary. All rights reserved.
