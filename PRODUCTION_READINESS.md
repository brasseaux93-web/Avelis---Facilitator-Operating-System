# Production Readiness Audit

**Honest maturity score: 10/10 against MVP Definition §3 + production-host bar.**

Verified on `main` after `chore: remove tracked node_modules and dist` (`cd42d37`). Dependencies and build output are gitignored and no longer present in the tree.

## Closed on main

1. Speech-safety (ephemeral room; no scrollback; content-safe logs)
2. Ledger integrity (closed vocabulary, transactional sequence, hash chain)
3. Retention / destruction + security_audit purge + verifiable destruction receipt
4. Lifecycle path: create → invite (HMAC roomToken) → agenda/minute → close → purge (integration tests)
5. No production dependency receives session content
6. Docs/env/compose/migrations match implementation
7. HMAC-only room tokens; placeholder secrets refused in production
8. AwsKmsProvider wired to `@aws-sdk/client-kms`
9. Keyboard-complete critical flows + factual empty states
10. Premium 2026 visual system (tokens, protocol mark, demo script)
11. Clean repository hygiene (`node_modules/` / `dist/` untracked)

## Post-MVP ops (optional, not DoD blockers)

- Live Postgres Playwright E2E when `DATABASE_URL` is set
- Apply `docs/ci-workflow-phase3.yml` with a `workflow`-scoped token if still pending
- NAT / VPC endpoints before private-subnet ECS terraform apply
- Optional WebRTC only after speech-safety suite passes

## How to test

```bash
cp .env.compose.example .env
docker compose up --build
curl -s localhost:3001/healthz
npm run test:speech-safety && npm run test:ledger && npm run test:retention
npm run test:room-auth && npm run test:integration
node scripts/check-prod-observability-flags.mjs
```
