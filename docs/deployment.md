# Deployment

> Operational guide for Avelis hosts. Does not claim legal privilege, subpoena resistance, or speech non-recoverability beyond product design.

## Topology

| Component | Role | Persistence |
|---|---|---|
| **api** | Express HTTP API, facilitator auth, ledger, retention cron | Stateless; uses Postgres |
| **room** | Ephemeral WebSocket process | **Memory only** — no volume |
| **postgres** | Session metadata, process ledger, minutes, destruction receipts, security audit | Encrypted at rest |
| **TLS terminator** | HTTPS / WSS edge (ALB, nginx, Caddy, Cloudflare) | Certificates only |

Compose local stack: `docker compose up --build` (services `postgres`, `api`, `room`).

Room isolation: set `ROOM_SWAP_DISABLED=true` and enforce `mem_limit` (see `docker-compose.yml`). Do not attach a volume to room state.

## Secrets

Required in production:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection |
| `JWT_SECRET` | Facilitator token HMAC |
| `ROOM_SHARED_SECRET` | Room token gate (must not be default) |
| `KMS_PROVIDER=aws` | Production KMS path |
| `AWS_KMS_KEY_ID` / `AWS_KMS_SIGNING_KEY_ID` | Envelope + signing keys |
| `TRUST_PROXY=true` | When TLS terminates upstream |

Never commit real secrets. Prefer AWS Secrets Manager / SSM (see `terraform/`).

Forbidden in production (startup refuses):

- `LOG_REQUEST_BODIES=true`
- `LOG_WEBSOCKET_PAYLOADS=true`
- `SESSION_REPLAY_ENABLED=true`
- `PRODUCT_ANALYTICS_ENABLED=true`
- `KMS_PROVIDER=local`

## TLS

- Terminate TLS at the edge (load balancer or reverse proxy).
- Forward to api/room over a private network.
- Set `TRUST_PROXY=true` on the API so client IPs are correct for rate limits.
- Prefer modern TLS (1.2+) and HSTS at the terminator.
- Room clients use `wss://` through the same terminator.

API also sets baseline headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.

## Observability (no content)

- Structured JSON logs: `level`, `event`, `requestId`, `durationMs` — never bodies, WS payloads, invite codes, or full emails.
- `GET /healthz` — liveness
- `GET /readyz` — database ping
- `GET /metrics` — in-memory counters: `sessions_opened`, `sessions_closed`, `purge_success`, `purge_failure`

## KMS

- Development: `KMS_PROVIDER=local` → `LocalDevKms`
- Production: `KMS_PROVIDER=aws` → `AwsKmsProvider` (wire `@aws-sdk/client-kms`; stub throws until credentials configured)
- Destruction receipts and ledger root signatures call `getKms().sign` / `verify`

## Retention cron

API starts `runDestructionCron` on an interval from `RETENTION_JOB_INTERVAL_MINUTES` (skipped under `VITEST=true`).

## Backups

- Retention of backups ≤ **max session retention (720h)** + host **recovery window** (typically ≤ 7 days).
- Encrypt backups at rest.
- **No prod→dev copies** of databases that still contain session bodies.
- Security audit events: default **30 days**, maximum **90 days** (ADR-0006).

### Purge-aware restore

1. Restore into an isolated recovery environment.
2. Before serving traffic, run destruction for all closed sessions past `retention_expires_at`.
3. Verify destruction receipts and absence of ledger/minute/agenda/party bodies for purged sessions.
4. Run speech-safety checks with synthetic canaries only.
5. See `docs/backup-restore.md` and `scripts/purge-aware-restore.sh`.

## Terraform scaffold

See `terraform/` for ECS/Fargate placeholders (api + room), Secrets Manager refs, encrypted RDS, KMS keys, and sticky-session notes for the room service.

## What this guide does not claim

Avelis does not guarantee legal privilege, immunity from compelled disclosure of data that still exists within retention, or that operators cannot misconfigure logging. Hosts must keep content-capture flags false and follow purge-aware backup policy.
