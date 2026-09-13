# Production Readiness Audit

**Honest maturity score: 9.5/10** - MVP Definition section 3 DoD substantially met (maturity PR #6 on main). **Premium 2026** visual system shipped (clean merge onto main): institutional tokens, premium overrides, auth/session/room UI density, protocol mark, visual-system + demo-script docs. Residual blockers below prevent an honest 10/10 claim.

## Maturity path - closed on main

### Shipped (maturity + Premium 2026)

1. **Speech-safety** - ephemeral room memory tests + observability sanitization (no email/@ in requestId).
2. **Ledger** - existing schema/hash-chain Vitest suite retained.
3. **Retention / destruction** - session purge + **security_audit_events** retention purge (default 720h / max 2160h); destruction receipt verify helper + tests.
4. **Lifecycle path** - API-level integration tests for create->invite roomToken (HMAC)->agenda/minute/close->verifiable purge receipt; Playwright smoke kept minimal.
5. **No production dependency receives session content** - content-capture flags guarded; structured logs scrub bodies/emails.
6. **Docs/env match** - compose requires secrets via env; `.env.compose.example`; threat model updated for room token rule.
7. **Macroscope P0s**
   - API entrypoint runs migrations before listen (`scripts/docker-api-entrypoint.sh`).
   - Raw ROOM_SHARED_SECRET never accepted as roomToken; all placeholders refused in prod (incl. change-me-room-secret-compose); compose binds 127.0.0.1 and requires env secrets.
   - security_audit_events purge in destructionWorker.
   - sanitizeRequestId / never log emails in arbitrary fields.
8. **AwsKmsProvider** wired to @aws-sdk/client-kms when AWS_KMS_KEY_ID / signing key set.
9. **Keyboard-complete critical flows + factual empty states** on session console / sessions list / room.
10. **Drizzle journal** registers 0002_security_audit_events.
11. **Terraform** - ECS execution Secrets Manager policy + managed execution policy; DATABASE_URL secret version; task KMS policy; NAT/VPC-endpoints callout.
12. **Premium 2026 visual** - `src/styles/tokens.css` + `premium-overrides.css`; facilitator auth/sessions/join/room routes; Logo protocol mark; favicon; `docs/visual-system.md` + `docs/demo-script.md`. No backend/maturity regressions in this visual-only merge.

### Residual (why not 10/10)

- Tracked node_modules/ + dist/ may still be on tip until operator shallow-clone git rm -rf (MCP cannot delete thousands of blobs; executor lacked gh/git push credentials for that cleanup).
- Live Postgres-backed create->...->purge E2E is optional (DATABASE_URL); pure-path + unit suites are the release gate here.
- Terraform still needs NAT or VPC endpoints before a real private-subnet apply (documented, not fully provisioned).
- CI workflow workflow-scope apply may remain pending.

## How to test

```bash
cp .env.compose.example .env   # fill secrets
docker compose up --build
curl -s localhost:3001/healthz
npm run test:speech-safety && npm run test:ledger && npm run test:retention
npm run test:room-auth && npm run test:integration
node scripts/check-prod-observability-flags.mjs
```
