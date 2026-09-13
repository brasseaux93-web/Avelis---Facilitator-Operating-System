#!/usr/bin/env bash
# Safe stub: prints purge-aware restore steps. Does not restore or mutate data.
set -euo pipefail

cat <<'STEPS'
=== Avelis purge-aware restore (STUB — review before any real restore) ===

1. Identify restore point and confirm it is NOT a prod→dev copy of session content.
2. Restore PostgreSQL to an isolated recovery environment (never overwrite live prod blindly).
3. BEFORE exposing the restored DB to application traffic:
   a. Run retention eligibility query for closed sessions past retentionExpiresAt.
   b. Execute destructionWorker / runDestructionCron until purge_success covers all due sessions.
   c. Verify destruction_receipts exist for purged sessions; bodies must be absent.
4. Confirm backups retention ≤ max session retention + recovery window (see docs/deployment.md).
5. Re-run speech-safety checks against the restored environment (canaries only).
6. Only then cut traffic / mark restore complete.
7. Document who authorized the restore and the recovery window used.

This script intentionally performs no database writes.
STEPS
