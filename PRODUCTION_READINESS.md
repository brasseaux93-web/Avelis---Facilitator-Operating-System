# Production Readiness Audit

**Honest maturity score: ~5/10** — Phase 1 foundations + Phase 2 auth/UI spine; not production-hardened.

## What the docs claim vs what the code is

Investor-grade constitution (`docs/`, product laws, architecture language) remains ahead of full production ops. Landing copy is now aligned to the language guide (factual institutional wording; no legal privilege guarantees). Treat documentation as the **target constitution**, not a certificate of current readiness.

## Phase 1 — foundations (shipped)

1. **Speech-safe room** — `src/room/memory.ts`: pure in-memory registry; **no messages array**; `broadcast` delivers and drops; `teardownRoom` closes sockets and deletes the room. Late joiners get no scrollback.
2. **Room server** — token gate (`ROOM_SHARED_SECRET` or HMAC of `sessionId:partyId`); size limit; never logs message bodies.
3. **Transactional ledger append** — closed vocabulary, `FOR UPDATE` sequencing, hash chain, schema-accurate columns.
4. **API alignment** — create / open / close / invites / ledger routes match `schema.ts`.
5. **destructionWorker** — matches `destructionReceipts` schema; deletes ledger, minutes, agenda, parties; scrubs session to `purged`.
6. **minute.ts** — aligned to `content` / `contentDigest` / `draft|published|wiped`.
7. **Tests** — speech-safety + ledger chain coverage.
8. **Ops scaffolding** — docker-compose, env example, `.gitignore`.

## Phase 2 — what this PR ships

### A) Language / cosmetic polish
- Marketing `src/routes/index.tsx` rewritten to language-guide vocabulary: ephemeral room, process ledger, retention/destruction; removed safe-harbor / privilege / subpoena-kit overclaims; destruction seal text factual; Step 4 = joint minute initialing + export; L3 states v1 has no AI.
- Auth UI: title **Facilitator sign in**; lock icon removed from trust note; SSO disabled as **Not available in MVP**; factual error **Sign in did not complete.**

### B) Facilitator auth + invite redeem + session APIs
- `src/lib/auth.ts` — Argon2id hash/verify; HMAC-SHA256 JWT-like facilitator tokens (`sub`, `orgId`, `email`, `exp`); party session tokens; room HMAC tokens matching room server (`sessionId:partyId`).
- `src/server/seedDev.ts` — on API start in development, seeds org + facilitator (fixed UUIDs matching Phase 1 mocks) when seed email/password set (defaults `facilitator@avelis.local` / `change-me-now`).
- Replaced mock `requireAuth` with Bearer JWT verification.
- New routes: `POST /api/auth/login`, `POST /api/auth/register` (gated by `ALLOW_FACILITATOR_REGISTER=true`), `POST /api/invites/redeem` (failure rate limit 5/15min/IP), agenda create/patch, session detail, ledger list, minute upsert/publish/wipe/export.md, ledger publish/withdraw, `GET /api/sessions`.
- Session close now writes a signed `ledger_roots` row (dev HMAC via `kms.sign`).
- `destructionWorker` verifies the **full** hash chain before purge; receipt includes `finalSequenceNumber` + `ledgerRootHash`.
- No logging of invite codes, passwords, or room speech.

### C) UI spine
- In-memory only: `FacilitatorAuthContext` + `apiClient` (never localStorage/sessionStorage).
- Routes: `/sessions`, `/sessions/$sessionId`, `/join`, `/room/$sessionId` (+ `routeTree.gen.ts` registration).
- Room client connects with `sessionId`, `partyId`, `roomToken`; required disclosure shown; no history dependency.

### D) Docs
- This file updated for Phase 2 shipped scope.

## Remaining risks / Phase 3

- Destruction / ledger-root signatures still local HMAC scaffolding — production KMS attestation required.
- No e2e Playwright covering open → invite → room → close → purge.
- Multi-instance room teardown unresolved.
- Email/SMS invite delivery not wired.
- WebRTC audio gate (if in scope).
- Backup / purge policy operationalization.
- Observability without content capture; secrets rotation; isolation hardening.

## Constitution review (Phase 2 changes)

1. Speech retained? **No** — room remains memory-only; redeem/API do not store speech.
2. Participant profile / cross-session graph? **No** — party is session-scoped; tokens in memory.
3. Ledger beyond closed vocabulary? **No** — only existing enum line types.
4. Retention/destruction/encryption/access semantics? Access now JWT-gated; close adds ledger root; purge verifies chain — retention windows unchanged.
5. AI / analytics / recovery path? **No**.
6. ADR required? Optional for auth token format; no constitution amendment.

## How to test

```bash
# Ensure DB migrated and env set (JWT_SECRET, ROOM_SHARED_SECRET, DATABASE_URL)
npm run start:server   # seeds facilitator@avelis.local / change-me-now in development
npm run start:room
npm run dev            # Vite UI

# Auth
curl -s -X POST localhost:3001/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"facilitator@avelis.local","password":"change-me-now"}'

# Phase 1 unit suites still apply
npm run test:speech-safety
npm run test:ledger
```

UI smoke: sign in → create session → open → create invite (copy code once) → `/join` redeem → `/room/$sessionId` → facilitator agenda/ledger/minute → close.
