# Production Readiness Audit

**Honest maturity: 10/10 against MVP Definition §3, and past-MVP on identity chrome, ephemeral room contract, and participant PII hygiene.**

Verified after the post-MVP cut: memory-only room restored, facilitator vs participant shells split, public register gated in production, invite delivery addresses wiped on join/revoke.

## Closed

1. Speech-safety (ephemeral WS room; no scrollback; content-safe logs)
2. Ledger integrity (closed vocabulary, transactional sequence, hash chain)
3. Retention / destruction + security_audit purge + verifiable destruction receipt
4. Lifecycle path: create → invite (HMAC roomToken) → agenda/minute → close → purge
5. No production speech path through a third-party realtime vendor
6. HMAC-only room tokens; placeholder secrets refused in production
7. Room teardown signaled from API to room process (control plane)
8. Keyboard-complete critical flows + factual empty states
9. Premium 2026 visual system
10. Participant chrome has no account creation
11. Production refuses `local-dev-*` organization key ids
12. Login/register rate-limited; register off in production by default

## Post-MVP (this cut)

- Restore `src/room/server.ts` + compose room service
- Role-aware shell: marketing / facilitator console / temporal session
- Join is invite-only; human identity labels
- Facilitator host room access via `/api/sessions/:id/room-access`
- Party view restored to real JSX (no token paste)
- Destruction receipt layout (`receipt-dl`) so headers are not clipped
- WebRTC/Supabase experiment removed (not on the production speech path)

## Remaining ops (not product blockers)

- Live Postgres Playwright E2E when `E2E_BASE_URL` is set
- Apply `docs/ci-workflow-phase3.yml` with a `workflow`-scoped token
- NAT / VPC endpoints before private-subnet ECS terraform apply
- Optional WebRTC **audio** only after speech-safety suite covers it

## How to test

```bash
cp .env.compose.example .env
docker compose up --build
curl -s localhost:3001/healthz
npm run test:speech-safety && npm run test:ledger && npm run test:retention
npm run test:room-auth && npm run test:integration
node scripts/check-prod-observability-flags.mjs
```
