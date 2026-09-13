# ADR-0003: Use session-scoped one-time invite codes

## Status

Accepted

## Context

Parties must join a bounded session without creating standing accounts or a participant directory.

## Decision

Use a session-scoped invite link plus high-entropy one-time code.

- Store only a hash of the code.
- Limit validation attempts.
- Invalidate code on successful use.
- Permit facilitator revocation.
- Keep delivery address encrypted and inaccessible to other parties.
- Destroy invite material at session purge.

## Consequences

- Parties have no reusable Avelis account.
- Lost invites require facilitator reissue.
- Invite delivery status may be represented as a facilitator-only process fact without storing provider message content.

## Compliance

This supports session-scoped identity and prevents cross-session participant persistence.