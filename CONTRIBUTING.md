# Contributing to Avelis

> This repository is governed by the Product Instruction. If a contribution conflicts with the constitution, the contribution is wrong.

## 1. Before starting

Read:

1. `docs/product-instruction.md`
2. `docs/architecture.md`
3. `docs/data-model.md`
4. `docs/ledger-spec.md` for ledger work
5. `docs/security-threat-model.md` for persistence, logging, encryption, access, or retention work
6. `docs/language-guide.md` for user-facing copy
7. `docs/visual-system.md` for interface work

## 2. Scope-creep defense

Reject proposals that introduce:

| Proposal | Reason |
|---|---|
| AI summary, transcription, classification of *speech*, or a model that writes the ledger | Speech-derived content and unaccountable authorship are prohibited |
| Process copilot that reads the live room | Only ledger-only snapshots are allowed (ADR-0007) |
| Persistent chat, scrollback, recording, replay, or export | Speech must remain ephemeral |
| Participant profile, directory, follower graph, or contacts surface | Identity is session-scoped |
| Facilitator notes about people or statements | Narrative and inference persistence |
| Analytics dashboard, room metrics, read receipts, or speaking-time data | Behavioral archive |
| CRM, HR, messaging, or collaboration integration | External persistence and scope expansion |
| File attachments or object-storage bodies | Expands durable content surface |
| Legal hold or e-discovery | Conflicts with bounded destruction |
| Decorative peace, people, lock, surveillance, or chat-history imagery | Violates visual constraints |

If unsure, open an issue before implementation.

## 3. Required review questions

Every pull request must answer:

1. Could this code store, log, cache, transmit, or derive speech?
2. Could it create a profile, social graph, behavior history, or analytics trail?
3. Does it change ledger vocabulary, payload schema, ordering, integrity, visibility, retention, or destruction?
4. Does it touch encryption, KMS, backup, export, browser storage, observability, or third-party services?
5. Does it require a Product Instruction amendment or ADR?

## 4. Code review checklist

### Speech safety

- [ ] No room message body is written to database, filesystem, object storage, logs, queues, analytics, error tracking, or backups.
- [ ] No audio is recorded or persisted.
- [ ] No transcript or stored caption is created.
- [ ] No AI receives or processes session speech. A process copilot may receive a speech-free ledger snapshot only.
- [ ] Browser durable-storage paths are absent or cleared and tested.
- [ ] No session replay or DOM-capture tool receives room or minute content.

### Ledger integrity

- [ ] Line type belongs to the closed vocabulary.
- [ ] Payload schema rejects unknown and prohibited fields.
- [ ] Actor, source, state, and organization scope are validated server-side.
- [ ] Sequence allocation is transactional.
- [ ] Hash-chain and signed-root behavior is preserved.
- [ ] No line update or individual delete path exists.
- [ ] Party visibility uses append-only visibility events.

### Retention and destruction

- [ ] Retention cannot be extended after session open.
- [ ] New retained data is included in purge logic.
- [ ] Destruction receipt excludes protected content.
- [ ] Backup and replica implications are documented.
- [ ] Purge failures cannot create false success attestations.

### Scope and language

- [ ] Feature is in MVP scope or approved post-MVP work.
- [ ] UI text follows the Language Guide.
- [ ] No forbidden visual or conceptual pattern is introduced.
- [ ] Error copy states facts rather than reassurance.

### Tests

- [ ] Speech non-persistence tests pass.
- [ ] Ledger integrity tests pass.
- [ ] Retention and destruction tests pass.
- [ ] Relevant end-to-end tests pass.
- [ ] New boundary behavior has regression coverage.

## 5. ADR requirements

Create an ADR for:

- Technology or library selection affecting persistence, logs, exports, analytics, WebSocket handling, audio, encryption, or KMS
- Change to room-server topology
- Change to key management
- Change to ledger vocabulary or payload semantics
- Change to retention, destruction, backup, or restore behavior
- Change to party visibility or identity-class behavior
- New third-party service
- Any exception to a documented security control

## 6. Local setup

```bash
git clone <repo-url>
cd avelis
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:migrate
npm run dev
```

Use placeholder-only data. Never paste real conversation, participant, customer, or production material into local fixtures, tests, issues, commits, or pull requests.

## 7. Test commands

```bash
npm test
npm run test:speech-safety
npm run test:ledger
npm run test:retention
npm run test:e2e
```

All speech-safety, ledger, and retention tests must pass before merge.

## 8. Branch and commit conventions

- Branch from `main`.
- Use `feat/[description]`, `fix/[description]`, `docs/[description]`, or `chore/[description]`.
- Use imperative commit subjects.
- Keep one coherent feature per pull request.
- Squash merge after approval.

## 9. Amendment process

Changes to the Product Instruction require:

1. An issue titled `Amendment: [description]`
2. Privacy and retention impact analysis
3. Product-owner approval
4. Required ADRs
5. Decision-log entry
6. Merged constitution change before implementation

Silent scope creep is a defect.