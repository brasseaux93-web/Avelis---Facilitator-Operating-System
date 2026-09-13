# Zero-knowledge posture

Avelis does **not** run a SNARK or STARK circuit. That is intentional.

Zero-knowledge proofs are for statements about data you still have. Speech is never kept. There is nothing to prove about a transcript that does not exist.

What institutions actually need is **verifiable destruction of process**, not a theater of proving silence.

## What we do instead

| Claim | Mechanism | Not |
|---|---|---|
| This talk is gone | It was never written (deliver-and-drop RAM) | A proof of deletion of a file we created |
| This process record was destroyed | Hash-chained ledger + signed destruction receipt | A Groth16 circuit |
| This receipt is the receipt | `ledgerRootHash` + `destructionManifestDigest` + verify path | Publishing session contents |

EDPB 02/2025 on blockchain: when you must leave an anchor, leave a **hash or commitment**, not the personal data. Avelis’s destruction receipt is that class of object — a digest of what was destroyed, not the bodies.

ZK would be the wrong spend: months of circuit work to prove a negative about data the constitution forbids us from holding. Hash-chain attestation is the honest 2026 answer.

## What we will not claim

- “Zero-knowledge rooms”
- “Cryptographically impossible to subpoena”
- “ZK-SNARK privacy”

If a future host needs a third-party timestamp on the receipt digest (OpenTimestamps-class), that is an anchor on a hash — still not a proof of speech, because speech was never hashed.
