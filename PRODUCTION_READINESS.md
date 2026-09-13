# Production Readiness Audit

**Honest maturity score: ~6.5/10** — Phase 1–3 foundations for a production *host*; not yet a polished product surface. Premium visual pass remains next.

## Phase 3 — production host + repo cleanup (this branch)

### Shipped

1. **KMS path** — `LocalDevKms` + `AwsKmsProvider` stub; `getKms()` via `KMS_PROVIDER=local|aws`; destruction + ledger root signing use `getKms().sign`.
2. **Observability without content** — structured JSON logs; `/healthz`, `/readyz`, `/metrics`; production guards on content-capture flags; CI script check.
3. **Room isolation** — production refuses default/missing `ROOM_SHARED_SECRET`; `ROOM_SWAP_DISABLED` documented; `Dockerfile.api` / `Dockerfile.room`; compose `api` + `room` + postgres (room `mem_limit`, no room volume).
4. **Backups / purge-aware restore** — real `docs/deployment.md`; `docs/backup-restore.md`; stub `scripts/purge-aware-restore.sh`.
5. **Security audit store (ADR-0006)** — `security_audit_events` + `recordSecurityEvent` (refuses message bodies); 30d default noted.
6. **TLS / prod config** — TLS termination documented; `TRUST_PROXY`; nosniff / frameguard deny / referrer-policy.
7. **CI** — desired workflow in `docs/ci-workflow-phase3.yml` (applying to `.github/workflows/ci.yml` requires a token with `workflow` scope); flag guard script; speech-safety + ledger + retention; **no e2e** until green path.
8. **Terraform** — ECS/Fargate api+room placeholders, Secrets Manager, encrypted RDS, `aws_kms_key` resources, sticky-session notes.
9. **Retention cron** — `runDestructionCron` on `RETENTION_JOB_INTERVAL_MINUTES` (not under Vitest).
10. **Repo cleanup** — demo screenshots/scripts removed when possible; README stubs; `.gitignore` lists `node_modules/`/`dist/`.

### Remaining / next

- Wire real `@aws-sdk/client-kms` credentials in `AwsKmsProvider`.
- Premium 2026 visual redesign (separate PR).
- Apply CI workflow file with a `workflow`-scoped token if still pending.
- Remove tracked `node_modules/` + `dist/` from tip if still present (shallow clone + `git rm -rf`).
- Green Playwright e2e path before enabling e2e in CI.

## How to test

```bash
docker compose up --build
curl -s localhost:3001/healthz
curl -s localhost:3001/readyz
npm run test:speech-safety && npm run test:ledger && npm run test:retention
node scripts/check-prod-observability-flags.mjs
```
