# Avelis

Private rooms for difficult conversations. Avelis sits in the room as a conflict agent — then the talk is gone.

Avelis is an **AI conflict-resolution operating system** for facilitators: shuttle diplomacy, workplace sessions, ombuds work, the talks that cannot become a file.

Three facts competitors will not copy:

1. **The room has no file.** Speech is RAM. Close destroys the live room.
2. **The third is named.** Avelis sits in the room on a disclosed mediation move. No hidden listener. No AI award.
3. **The facilitator writes the record.** Named moves. No model writes a ledger line.

Parties join a private live room. Room messages are not stored. Process records die on a deadline you choose. A **destruction receipt** remains as limited proof.

The product object is a **session**. It is not a community, a case file, a participant directory, or a chat app.

---

## Who uses it

**Facilitators** have organization accounts. They run a management console: open a session, invite parties, write process lines, work with the process copilot, close the room, and later verify a destruction receipt.

**Participants** never create an account. They redeem a one-time invite. They see Avelis in the room. Their credentials live in the browser tab.

---

## Core promise

- The live room is private and temporal. Messages exist in memory while the room is open.
- Avelis is a disclosed conflict agent in that room. A rolling RAM window may go to the session’s inference provider (Groq by default). Avelis does not keep a transcript.
- No model writes the process ledger. The facilitator confirms every line.
- A session’s retained data is destroyed at the configured deadline.
- A destruction receipt remains as limited evidence that destruction occurred.

## Repository status

**Post-MVP on `main`.** Ephemeral WebSocket room is the speech path. A visible conflict agent runs in the room process. Facilitator chrome and participant chrome are separate. Public self-serve registration is off in production unless explicitly enabled.

### What works

- Ephemeral WebSocket room (HMAC party tokens; no stored message history)
- Visible conflict agent (`@avelis`, facilitator invoke, named mediation techniques)
- Groq: `llama-3.1-8b-instant` for ranking/whispers, `llama-3.3-70b-versatile` for room speech
- Facilitator process copilot on the session console (ledger-only ranker + dialogue)
- Session create → open → invite → close → retention purge + verifiable destruction receipt
- Closed-vocabulary ledger with transactional sequencing and hash chaining
- Facilitator sign-in, party join, live room
- Agenda + joint minute; KMS factory (`local` | `aws`)
- `docker compose` for postgres + api + room


## What persists

| Data | Persists? | Retention |
|---|---:|---|
| Live room messages | No | Memory-only; released after delivery; destroyed on room teardown |
| Transcript | No | Never created |
| Session metadata | Yes | Destroyed at session retention expiry |
| Process ledger | Yes | Destroyed at session retention expiry |
| Party invite records | Yes | Destroyed at session retention expiry; delivery email wiped after join |
| Joint-minute body | Optional | Destroyed at session retention expiry or wiped earlier |
| Destruction receipt | Yes | Retained indefinitely unless host policy specifies otherwise |
| Restricted security audit events | Yes, minimally | Default 30 days; maximum 90 days |

## What Avelis is not

- A chat app or persistent messaging system
- A social network or participant directory
- A therapy product, HR case-management tool, or whistleblowing hotline
- A transcription, sentiment, or hidden-listening product
- A legal-signature, legal-hold, or discovery platform

Avelis does **not** claim legal privilege or subpoena immunity. See the [Language Guide](docs/language-guide.md).

## Quick start

```bash
cp .env.compose.example .env   # set JWT_SECRET, ROOM_SHARED_SECRET, LOCAL_DEV_* keys
docker compose up --build
# API 127.0.0.1:3001  Room 127.0.0.1:3002  Postgres 127.0.0.1:5432

npm run test:speech-safety
npm run test:ledger
npm run test:retention
npm run test:process-copilot
npm run test:integration
```

Dev without full compose (Postgres required):

```bash
cp .env.example.txt .env
npm install
npm run dev
```

## Stack

- **UI:** Vite + React + TanStack Router (Premium 2026 tokens — not a generic Tailwind kit)
- **API:** Express · **Room:** memory-only WebSocket · **DB:** PostgreSQL 16 + Drizzle
- **Auth:** Argon2id + HMAC JWT · **Crypto:** AES-GCM + KMS factory
- **Tests:** Vitest (speech-safety, ledger, retention, process-copilot, room-auth, integration) · Playwright E2E (optional)

## Documentation

| Document | Purpose |
|---|---|
| [Product Instruction](docs/product-instructions.md) | Binding product constitution |
| [Architecture](docs/architecture.md) | Durable and ephemeral system design |
| [Data Model](docs/data-model.md) | Entities, encryption, retention |
| [Language Guide](docs/language-guide.md) | Approved wording |
| [Agent rules](docs/agent-rules.md) | Legal and tactical conduct for the process copilot |
| [Mediation techniques](docs/mediation-techniques.md) | Named moves the conflict agent may use |
| [Visual System](docs/visual-system.md) | Premium 2026 constraints |
| [Production readiness](PRODUCTION_READINESS.md) | Live maturity audit |
| [Contributing](CONTRIBUTING.md) | Change control |

## License

Proprietary. All rights reserved.
