# ADR-0001: Isolate the room server as an ephemeral process

## Status

Accepted

## Context

Avelis must deliver live room text without persisting speech. Co-locating room state with durable application concerns increases the risk that room content enters logs, crash state, request instrumentation, or persistence paths.

## Decision

Run the room server as a distinct, memory-only process or isolated runtime component.

The room server:

- Holds active room state in volatile memory only.
- Has no permission to write room content to PostgreSQL.
- Does not write message bodies to logs.
- Terminates on session close.
- Does not recover room state after restart.

## Consequences

- A room-server restart destroys live room state.
- Horizontal scaling may be added later through session pinning.
- Operational debugging must use payload-free health signals.
- Speech non-persistence tests must cover the room boundary.

## Compliance

This supports Product Instruction Sections 2, 3, and 7 by keeping speech outside durable infrastructure.