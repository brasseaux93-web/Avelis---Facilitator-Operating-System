# ADR-0006: Separate the process ledger from restricted security audit data

## Status

Accepted

## Context

A facilitator-visible process ledger and a security audit record serve different purposes. Combining them risks exposing operational security information to parties or turning the process record into a behavioral surveillance archive.

## Decision

Maintain two separate append-only records:

- The session process ledger, defined by the Ledger Specification and destroyed at session retention expiry.
- A restricted, minimal security audit record with 30-day default and 90-day maximum retention.

The security audit record contains no speech, room messages, participant behavioral telemetry, device fingerprinting, or location history.

## Consequences

- Operators require separate access controls for security events.
- Party views cannot retrieve security records.
- Security audit retention is independently configurable only within the stated maximum.

## Compliance

This preserves the ledger’s narrow process purpose and limits operational data retention.