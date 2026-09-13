# Build order

> Dependency-aware sequence. Prefer constitution docs before features.

1. Schema + migrations (sessions, ledger, receipts)
2. Ephemeral room (memory-only, token gate)
3. Ledger append + hash chain
4. Facilitator auth + session lifecycle APIs
5. Invites + party join (no speech persistence)
6. Joint minute (optional) + export buffers memory-only
7. Retention / destruction worker + KMS signing path
8. Observability without content + health endpoints
9. Deployment topology (api / room / postgres) + TLS notes
10. Premium visual polish (separate pass)

Do not ship AI interpretation, transcript features, or product analytics over session content.
