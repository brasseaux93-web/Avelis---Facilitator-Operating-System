# Avelis evaluation packet — 13 September 2026

Founder: Tyler Brasseaux, systems architect.

This is what counsel gets. It is not a signed DPA until both sides execute.

## Processing

- Facilitator account (email).
- Optional invite delivery address — wiped on join or revoke.
- Process ledger: closed vocabulary, not quotation.
- Optional joint minute: facilitator-authored, not a transcript.
- Destruction receipt: hashes after purge.

## Not processed

Live-room messages are delivered and dropped. Optional mesh voice is
browser-to-browser. Avelis does not receive audio frames. No transcript,
captions, or AI summary of the talk.

## Conflict agent

If inference is configured, Groq may see a RAM window of live text while the
room is open. Disclosed to every party. Not stored by Avelis. The agent does
not write the ledger.

## Subprocessors

| Party | Role | Sees speech? |
|---|---|---|
| Host (you, or Avelis-operated) | Compute, process records | Ledger and optional minute until destruction |
| Groq | Optional disclosed agent | RAM window while open, if configured |
| SMTP (if configured) | Invite mail | Invite code, not room talk |
| STUN (Cloudflare default) | NAT for optional voice | Addresses, not audio |

## Retention

Chosen in draft (0–30 days), locked at open, then enforced. After purge, bodies
are gone. The receipt remains. No undelete.

## What we will not say

Avelis does not claim attorney–client privilege or subpoena immunity. We cannot
produce a transcript we never made.
