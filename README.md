# Avelis

People cannot speak freely if the room becomes evidence.

Avelis is for the conversations that have to happen — shuttle diplomacy, workplace facilitation, an ombuds session — where writing everything down would change what people are willing to say. It gives the facilitator a **process ledger** (who was invited, what was tabled, what was marked agreed) and it **does not keep the talk**.

The live room exists only while the session is open. Messages are delivered and dropped. There is no transcript, no AI summary, no scrollback after close. When the retention window ends, process records are destroyed and a **destruction receipt** remains as the limited proof that destruction happened.

The product object is a **session**. It is not a community, a case file, a participant directory, or a chat app.

---

## Who uses it

**Facilitators** have organization accounts. They run a management console: open a session, invite parties, write process lines, optionally publish a joint minute, close the room, and later verify a destruction receipt.

**Participants** never create an account. They redeem a one-time invite. Their credentials live in the browser tab. When the tab or the room dies, so does their access.

---

## Core promise

- Text in the room exists in memory only while the room is open (deliver-and-drop; no server scrollback).
- Avelis never generates a transcript and does not use AI to interpret or write process records.
- The ledger records authorized process facts, not speech.
- A session’s retained data is destroyed at the configured deadline.
- A destruction receipt remains as limited evidence that destruction occurred.

## Repository status

**Post-MVP on `main`.** Ephemeral WebSocket room restored as the speech path. Facilitator chrome and participant chrome are separate. Public self-serve registration is off in production unless explicitly enabled. Invite delivery addresses are wiped on join/revoke.

WebRTC / third-party signaling is **not** on the production speech path (see `deprecated/`).

### What works

- Ephemeral WebSocket room (HMAC party tokens only; raw shared secret rejected; no message history)
- Session create → open → invite → close → retention purge + verifiable destruction receipt
- Closed-vocabulary ledger with transactional sequencing and hash chaining
- Facilitator sign-in, session console, party join, live room
- Room teardown across API and room processes (loopback control plane)
- Agenda + joint minute; KMS factory (`local` | `aws`)
- `/healthz`, `/readyz`, `/metrics`; content-capture flags refused in production
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
- An AI assistant, transcription, or sentiment product
- A legal-signature, legal-hold, or discovery platform

Avelis does **not** claim legal privilege or subpoena immunity. See the [Language Guide](docs/language-guide.md).

## Pitch materials

Institutional decks (investor, evaluation, five-year model, one-pager), speaker notes, and sourced market citations live in [`pitch/`](pitch/). They follow this constitution and the language guide. Founder: **Tyler Brasseaux**, systems architect.

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
npm run dev
```

## Stack

- **UI:** Vite + React + TanStack Router (Premium 2026 tokens — not a generic Tailwind kit)
- **API:** Express · **Room:** memory-only WebSocket · **DB:** PostgreSQL 16 + Drizzle
- **Auth:** Argon2id + HMAC JWT · **Crypto:** AES-GCM + KMS factory
- **Tests:** Vitest (speech-safety, ledger, retention, room-auth, integration) · Playwright E2E (optional)

## Documentation

| Document | Purpose |
|---|---|
| [Product Instruction](docs/product-instructions.md) | Binding product constitution |
| [Architecture](docs/architecture.md) | Durable and ephemeral system design |
| [Data Model](docs/data-model.md) | Entities, encryption, retention |
| [Language Guide](docs/language-guide.md) | Approved wording |
| [Visual System](docs/visual-system.md) | Premium 2026 constraints |
| [Production readiness](PRODUCTION_READINESS.md) | Live maturity audit |
| [Contributing](CONTRIBUTING.md) | Change control |

## License

Proprietary. All rights reserved.
