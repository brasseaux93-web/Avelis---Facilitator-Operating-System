# Production Readiness Audit — Phase 1

**Honest maturity score: ~3/10** — pre-MVP scaffolding with strong constitutional docs, not a shippable product.

## What the docs claim vs what the code is

Investor-grade constitution (`docs/`, product laws, architecture language) is ahead of the implementation. The landing / language-guide copy overclaims relative to runnable software: speech ephemerality, destruction attestation, and facilitator OS flows are described as product truths while large surface areas remain stubs or marketing pages only.

Treat documentation as the **target constitution**, not a certificate of current readiness.

## Code gaps (pre–Phase 1)

| Area | Gap |
|------|-----|
| Auth | Mock facilitator headers; not JWT. Insecure by design until Phase 2. |
| Session UI | Marketing / landing routes dominate; incomplete facilitator session operating UI. |
| Room | Previously retained an in-memory **message history** buffer and replayed scrollback to late joiners (violates architecture §4). |
| Ledger API | Mock sequence/hash; field names mismatched schema (`payloadEncrypted` etc.). |
| destructionWorker | Wrote non-existent fields (`destroyedAt`, `receiptHash`); did not delete parties/agenda. |
| minute.ts | Used `contentEncrypted` / status `final` — not in schema. |
| Tests | Speech-safety tests were stubs asserting `typeof teardownRoom === 'function'`. |
| Repo hygiene | `node_modules` / `dist` risk without a solid `.gitignore`. |

## Phase 1 — what this PR fixed

1. **Speech-safe room** — `src/room/memory.ts`: pure in-memory registry; **no messages array**; `broadcast` delivers and drops; `teardownRoom` closes sockets and deletes the room. Late joiners get no scrollback.
2. **Room server** — token gate (`ROOM_SHARED_SECRET` or HMAC of `sessionId:partyId`); size limit; never logs message bodies; tests import `memory.ts` only.
3. **Transactional ledger append** — `src/lib/ledgerAppend.ts` with closed vocabulary, `FOR UPDATE` sequencing, `computePayloadDigest` / `computeLineHash` chain, schema-accurate columns.
4. **API alignment** — create / open / close / invites / ledger routes match `schema.ts` field names; close tears down room and appends `room_destroyed`.
5. **destructionWorker** — matches `destructionReceipts` schema; verifies tip hash; deletes ledger, minutes, agenda, parties; scrubs session to `purged`.
6. **minute.ts** — aligned to `content` / `contentDigest` / `draft|published|wiped`.
7. **Tests** — real speech-safety coverage; ledger chain + closed line-type list validation.
8. **Ops scaffolding** — docker-compose credentials aligned to `.env.example.txt`; `ROOM_PORT`, `ROOM_SHARED_SECRET`, `API_PORT`; default DB URL `postgresql://avelis:avelis@localhost:5432/avelis`.
9. **`.gitignore`** — ignore `node_modules`, `dist`, env files, coverage, etc.

## Remaining risks (do not ship to production on Phase 1 alone)

- Mock auth (`AUTHORIZATION_BYPASS` / dev mock) — anyone who can reach the API can act as facilitator.
- No real org/facilitator bootstrap in DB for happy-path inserts without seed data.
- Destruction signature is HMAC with local signing key, not KMS attestation.
- No e2e Playwright flow covering open → invite → room → close → purge.
- Landing / language-guide marketing still overclaims vs code — copy must be dialed back or gated before external demos.
- Room and API share process machine memory for teardown only when co-located; multi-instance room teardown is unresolved.

## Phase 2 (next)

- Real facilitator JWT auth (replace mock).
- Invite join API + party UI.
- Production KMS for encryption/signing.
- e2e Playwright full facilitator flow.
- WebRTC gate (if in product scope).
- Backup / purge policy operationalization.
- Tone down landing language-guide claims to match shipped guarantees.

## Phase 3

- Hardening for production ops: isolation, secrets rotation, observability without content capture, multi-instance room topology, audit of destruction attestation.

## How to test this PR

```bash
npm test -- tests/speech-safety
npm test -- tests/ledger
# or
npm run test:speech-safety
npm run test:ledger
```
