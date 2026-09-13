# Production Readiness Audit

**Honest maturity score: 9/10** - MVP Definition section 3 DoD substantially met on this branch (cut from current `main` after PR #5); residual blockers below prevent an honest 10/10 claim.

## Maturity 10 branch - close MVP DoD + production hardening

### Shipped on prod-readiness/maturity-10-onto-main

1. **Speech-safety** - ephemeral room memory tests + observability sanitization (no email/@ in requestId).
2. **Ledger** - existing schema/hash-chain Vitest suite retained.
3. **Retention / destruction** - session purge + **security_audit_events** retention purge (default 720h / max 2160h); destruction receipt verify helper + tests.
4. **Lifecycle path** - API-level integration tests for create->invite roomToken (HMAC)->agenda/minute/close->verifiable purge receipt; Playwright smoke kept minimal.
5. **No production dependency receives session content** - content-capture flags guarded; structured logs scrub bodies/emails.
6. **Docs/env match** - compose requires secrets via env; `.env.compose.example`; threat model updated for room token rule.
7. **Macroscope P0s from PR #3**
   - API entrypoint runs migrations before listen (`scripts/docker-api-entrypoint.sh`).
   - Raw ROOM_SHARED_SECRET never accepted as roomToken; all placeholders refused in prod (incl. change-me-room-secret-compose); compose binds 127.0.0.1 and requires env secrets.
   - security_audit_events purge in destructionWorker.
   - sanitizeRequestId / never log emails in arbitrary fields.
8. **AwsKmsProvider** wired to @aws-sdk/client-kms when AWS_KMS_KEY_ID / signing key set.
9. **Keyboard-complete critical flows + factual empty states** on session console / sessions list / room.
10. **Drizzle journal** registers 0002_security_audit_events.
11. **Terraform** - ECS execution Secrets Manager policy + managed execution policy; DATABASE_URL secret version; task KMS policy; NAT/VPC-endpoints callout.

### Residual (why not 10/10)

- Tracked node_modules/ + dist/ may still be on tip until operator shallow-clone git rm -rf (MCP cannot delete thousands of blobs; executor lacked gh/git push credentials for that cleanup).
- Live Postgres-backed create->...->purge E2E is optional (DATABASE_URL); pure-path + unit suites are the release gate here.
- Terraform still needs NAT or VPC endpoints before a real private-subnet apply (documented, not fully provisioned).
- Premium visual redesign and CI workflow workflow-scope apply remain out of MVP DoD.

## How to test

```bash
cp .env.compose.example .env   # fill secrets
docker compose up --build
curl -s localhost:3001/healthz
npm run test:speech-safety && npm run test:ledger && npm run test:retention
npm run test:room-auth && npm run test:integration
node scripts/check-prod-observability-flags.mjs
```
