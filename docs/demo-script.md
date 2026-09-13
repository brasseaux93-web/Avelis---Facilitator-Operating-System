# Investor demo script (≈5 minutes)

Factual walkthrough of the facilitator operating system. No legal overclaims.

**Prep:** Docker Compose Postgres up; `.env` from `.env.example.txt` with `ENABLE_DEMO_SEED=true`; `npm run dev`; seed facilitator auto-created in development (`facilitator@avelis.local` / `change-me-now` unless overridden).

**One-click path:** Open `/demo` → **Prepare demo seed** → Sign in → open draft session (or `/sessions`).

---

## 1. Sign in (30s)

1. Open `/auth` (or use the Sign in button on `/demo`).
2. Sign in with the seed facilitator credentials.
3. State: *Facilitator accounts are organization-scoped. Session tokens stay in memory only.*

## 2. Create session (45s)

1. Land on `/sessions` (or open the prepared draft titled **Investor demo session**).
2. Point to the disclosure: *Room messages are delivered live and are not stored by Avelis.*
3. Create a session with a short title; leave retention at 72h (or show 0–720 range).
4. Open the session console (`/sessions/:id`).

## 3. Invite (45s)

1. Create an invite (identity class e.g. `role_only`).
2. Copy the one-time invite code (shown once in the modal).
3. Optionally **Deliver** (email when SMTP configured; otherwise copy-link returns a fresh code).
4. **Resend** / **Revoke** available from the party list.
5. Note: parties have no standing accounts.

## 4. Join + room (90s)

1. In a second browser / private window, open `/join`.
2. Redeem the code; enter the live room (`/room/:sessionId`).
3. Send 1–2 messages.
4. Point to the room banner: messages are live-only; late joiners have no history; no storage.
5. Optionally open `/party` with the in-memory party token to show published ledger lines / minute.
6. Optionally open a third join to show empty history for late joiners.

## 5. Ledger + minute (60s)

1. Back in the facilitator console: open session if still draft, table an agenda item, mark agreed/parked.
2. Show ledger lines — closed vocabulary process facts only. Use **Publish** / **Withdraw** for party visibility.
3. Optional joint minute: save draft → publish → export markdown (or wipe).
4. State: *Room speech does not appear in the ledger.*

## 6. Close (30s)

1. Close the session.
2. State: *Closing ends room access and destroys the live room. Messages cannot be recovered. Process records retain until the selected destruction deadline.*
3. After purge: facilitator console **Destruction receipt** panel (*Session records were destroyed. The destruction receipt remains.*)

---

## Talking points (approved)

- Product object is the **session**.
- Speech is ephemeral; process may be retained temporarily.
- Optional joint minute is separate from the live room.
- The process copilot ranks next process actions from the ledger. It does not read the room.
- Destruction is a product feature, not an afterthought.
- Demo helpers: `/demo`, `GET /api/demo/status`, `POST /api/demo/prepare` (dev/demo only).

## Do not say

- Guaranteed private / confidential by law / legally binding
- Chat history, transcript (except to deny), recording, recover conversation
- Safe space, trust, healing, peace, reconciliation outcomes
