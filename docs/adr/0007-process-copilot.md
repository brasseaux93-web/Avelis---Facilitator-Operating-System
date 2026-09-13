# ADR-0007: Facilitator process copilot (ledger-only)

## Status

Accepted

## Context

Avelis is a facilitator operating system for conflict-resolution sessions. Facilitators asked for help on *what process step to take next*. 2026 capital markets fund AI products. Putting a model on the live room would create a transcript, a third-party speech path, and an unaccountable author of the ledger — all forbidden.

## Decision

1. Speech non-persistence remains governing law. Room text and audio never enter a model.
2. A **process copilot** is a facilitator-only, non-authoritative aid.
3. Allowed inputs: session lifecycle, party *counts* and identity *classes* (not labels or addresses), agenda labels and marks, caucus open/closed (not membership), process marks, joint-minute *status* (not body unless the facilitator later opts in via a future amendment).
4. Allowed outputs: ranked closed-vocabulary process actions, generic process questions, a joint-minute *outline* from already-marked agenda facts.
5. The copilot never appends ledger lines. The facilitator confirms every action through existing APIs.
6. Prompts and completions are memory-only. Avelis does not log them, store them, or train on them.
7. A deterministic playbook always runs. An optional configured model may *rank and phrase* the same snapshot; it cannot invent line types.
8. A firewall rejects snapshots that contain speech-shaped keys before any model call.

## Consequences

- Hosts may enable a third-party model via `PROCESS_COPILOT_*` environment variables. Production should require a DPA with that provider and zero-retention settings.
- Without those variables, the playbook still works.
- Product language must say "process copilot", never "AI mediator", "insights", or "summary".

## Compliance

This amends Product Instruction §5, §8, §9, and §12. Speech boundary, closed ledger, and destruction are unchanged.
