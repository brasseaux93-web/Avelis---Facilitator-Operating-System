# Production Readiness Audit

**Honest maturity score: ~7/10** — Phase 1–3 foundations for a production *host*, plus Premium 2026 visual / demo polish on the facilitator surface. Not yet a fully hardened multi-tenant SaaS.

## Premium 2026 visual pass (`prod-readiness/premium-2026`)

### Shipped

1. **Visual constitution** — `docs/visual-system.md` binding tokens, type, forbidden imagery (§11).
2. **Design tokens** — `src/styles/tokens.css` (deep near-black canvas, warm paper panels, desaturated teal accent, Google-free system type + mono ledger), imported after `style.css` so tokens win; `premium-overrides.css` for leftover hardcoded accents.
3. **Surface restyle** — `auth.css`, `sessions.css` keep stable class names; institutional density for sessions / join / room.
4. **Protocol mark** — `Logo.tsx` + `public/favicon.svg` geometric A (not lock/shield).
5. **Facilitator UX** — empty states with required disclosures; room as ephemeral protocol stream; keyboard focus styles.
6. **Workflow docs** — `docs/demo-script.md` (5-minute investor path); CONTRIBUTING / README local-dev clarity.

### Remains out of scope for this pass

- No AI, no localStorage for room/party credentials, no legal overclaims reintroduced.
- Screenshot capture optional for marketing; not required for merge.

## Phase 3 — production host + repo cleanup

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

Local UI path: see README (`npm run dev` + seed facilitator) and `docs/demo-script.md`.
