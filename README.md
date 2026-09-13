# Avelis

> A facilitator operating system for dialogues that must not leave a transcript.

Avelis keeps a bounded **process ledger** for a facilitated session and destroys live-room speech. The room is ephemeral. The joint minute is optional. No transcript is created.

## Documentation

| Document | Purpose |
|---|---|
| [Product Instruction](docs/product-instructions.md) | Binding product constitution |
| [Architecture](docs/architecture.md) | Durable and ephemeral system design |
| [Data Model](docs/data-model.md) | Entities, relationships, encryption, and retention |
| [Ledger Spec](docs/ledger-spec.md) | Closed process-ledger vocabulary and validation rules |
| [Session Lifecycle](docs/session-lifecycle.md) | State machine and destruction sequence |
| [Security & Threat Model](docs/security-threat-model.md) | Privacy, security, and non-persistence controls |
| [MVP Definition](docs/mvp-definition.md) | Must-ship and must-not-ship scope |
| [Testing Strategy](docs/testing-strategy.md) | Required safety, integrity, and lifecycle tests |
| [Deployment](docs/deployment.md) | Environments, secrets, backups, monitoring, and operations |
| [Backup / restore](docs/backup-restore.md) | Purge-aware backup checklist |
| [Build Order](docs/build-order.md) | Dependency-aware implementation sequence |
| [Language Guide](docs/language-guide.md) | Approved and prohibited product language |
| [Visual System](docs/visual-system.md) | Interface principles and visual constraints |
| [ADRs](docs/adr/) | Binding technical decisions |
| [Production readiness](PRODUCTION_READINESS.md) | Honest maturity audit |
| [Contributing](CONTRIBUTING.md) | Change-control and review requirements |

## Local stack

```bash
docker compose up --build
# api :3001  room :3002  postgres :5432
# Health: GET /healthz  Ready: GET /readyz
```

Or develop against compose Postgres only:

```bash
docker compose up postgres
npm run dev
```

## Status

Pre-MVP. The Product Instruction governs all features, documentation, implementation, and operational decisions. No AI. No speech persistence. No legal overclaims.

## License

Proprietary. All rights reserved.
