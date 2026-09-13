# Production Readiness Audit

**Honest maturity score: 9.5/10** — MVP DoD closed on `main` (PR #6); Premium 2026 visual/demo polish lands in this PR. Residual for 10/10: tracked `node_modules`/`dist` removal, optional live-DB E2E, NAT/VPC before terraform apply.

## Premium 2026 (this PR)

1. `docs/visual-system.md` — binding visual constitution (§11)
2. `src/styles/tokens.css` + `premium-overrides.css` — institutional palette; tokens win over legacy CSS
3. `auth.css` / `sessions.css` — facilitator density; protocol-stream room
4. Geometric protocol mark (`Logo.tsx`, `favicon.svg`) — not lock/shield
5. Empty states + non-persistence disclosures; `docs/demo-script.md`

No AI, no localStorage for credentials, no legal overclaims.

## Already on main (maturity PR #6)

- HMAC-only room tokens; placeholder secrets refused in prod
- Migrations on API start; compose secret hardening
- Security audit retention purge; requestId/email sanitization
- `@aws-sdk/client-kms` wired; receipt verify + room-auth + integration tests
- Keyboard-complete session flows + factual empty states

## Residual (why not 10/10 yet)

- Operator shallow-clone: `git rm -rf node_modules dist` if still tracked
- Live Postgres E2E optional under `DATABASE_URL`
- NAT/VPC endpoints before private-subnet ECS apply
- CI workflow file may still need `workflow`-scoped token apply

## How to test

```bash
cp .env.compose.example .env
docker compose up --build
npm run test:speech-safety && npm run test:ledger && npm run test:retention
npm run test:room-auth && npm run test:integration
node scripts/check-prod-observability-flags.mjs
```

UI: `docs/demo-script.md`.
