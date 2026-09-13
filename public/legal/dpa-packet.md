# Avelis Data Processing Packet
## Companion to the mediator Letter of Intent

**Version:** 13 September 2026  
**Status:** Evaluation form. Not a signed contract until both signature blocks are complete.  
**Send with:** `loi-mediator.md`

Prepared by Tyler Brasseaux, founder & systems architect. This packet describes **what the software does**, not what would sound better in a pitch. Have counsel mark it. Do not wait for a forty-page MSA before the first evaluation session.

---

## How to use this packet

1. Attach it to the Letter of Intent.
2. Counsel reads Annex I (what exists) and Annex II (who else might see a RAM window).
3. If the Host will run evaluation sessions, both sides sign **Part A** (this form) for the ninety-day period.
4. Conversion to a paid seat requires the same form, or a replacement executed in writing. This packet does not auto-renew into production.

Governing commercial terms for the evaluation sit in the LOI. This packet governs **personal data**. If they conflict on speech, this packet wins: room talk is not stored.

---

# Part A — Data Processing Agreement (evaluation)

**Controller (“Host”)**  
Legal name: ________________________________  
Address: ____________________________________  
Contact: ____________________________________

**Processor (“Avelis”)**  
Tyler Brasseaux / Avelis Facilitator Operating System  
Contact: the evaluation address used for the LOI

**Effective date:** the later of the two signature dates, or the start of the LOI evaluation period, whichever is first.

### 1. Roles

The Host is the controller (and, where CCPA applies, the business) of personal data it submits to Avelis: facilitator account data, optional invite delivery addresses, process-ledger labels, and any joint minute the Host authors.

Avelis is the processor (and, where CCPA applies, the service provider). Avelis processes only on the Host’s documented instructions, which are: provide the session OS described in Annex I, for the evaluation, then destroy retained process records at the Host-chosen deadline.

Parties to a session are the Host’s parties. They do not have standing accounts on Avelis.

### 2. Subject matter, duration, nature, purpose

| | |
|---|---|
| Subject | Operation of a facilitated session: live room, optional disclosed conflict agent, process ledger, optional joint minute, destruction receipt. |
| Duration | The evaluation period in the LOI (ninety days, unless ended earlier), plus the retention window the Host set on each session (0–30 days from close). |
| Nature | Hosted software. Live speech is transient. Process records are stored, encrypted, then destroyed. |
| Purpose | Let the Host run talks that must not become a transcript, and keep a process trail that is not quotation. |

Avelis shall not process personal data for advertising, model training, scoring of parties, or building a directory.

### 3. Categories

**Data subjects.** Facilitators at the Host. Parties invited to a session (ephemeral). Optional delivery-address recipients.

**Personal data processed (retained).**

| Category | Examples | Retention |
|---|---|---|
| Facilitator account | Email, credential verifier | For the seat, until the Host closes it |
| Invite delivery address | Email used once to send a code | Wiped on join or revoke |
| Process ledger | Closed-vocabulary lines, timestamps, identity class, display label | Until the session’s destruction deadline |
| Joint minute (optional) | Facilitator-authored text | Same deadline, or earlier wipe |
| Destruction receipt | Hashes, timestamps, final sequence | Remains after purge |

**Not processed as a retained record.**

Live-room message bodies. Audio frames. Captions. Transcripts. AI summaries of the talk. A process clock in RAM. Mesh-voice media.

Avelis does not create those objects. It cannot produce them later.

**Special category / sensitive data.** The Host shall not put health data, SSNs, government ID numbers, or similar into ledger labels or the joint minute. The live room is still not a file; that instruction is about what the Host chooses to persist.

### 4. Instructions

The Host’s instructions are this packet, the product constitution the Host is shown at evaluation, and in-product controls (open, invite, retention, wipe, close). Avelis will not write a ledger line from model output. Avelis will not enable party accounts, recording, or settlement scoring during the evaluation.

If a legal duty requires Avelis to process beyond these instructions, Avelis will tell the Host unless the law forbids that notice.

### 5. Confidentiality and personnel

People who can reach evaluation systems are limited to the founder and any engineer the Host is told about in writing. They are under a duty of confidentiality. They are not in the room as undisclosed listeners.

### 6. Security

Annex III. Production evaluation traffic, if any, requires `KMS_PROVIDER=aws` and named key IDs. The local development stub is forbidden in production. Speech is not in KMS: keys cover process records and destruction signatures.

### 7. Subprocessors

Annex II is the list. The Host authorizes those subprocessors for the purposes stated.

Avelis will give **thirty (30) days** notice before adding a subprocessor that can see personal data, except for an emergency replacement required to keep the room available, in which case notice follows as soon as practicable. The Host may object on reasonable grounds. Objection may mean the evaluation ends; it does not mean Avelis must keep an objected subprocessor.

**Groq.** Optional. Only if inference is configured for the disclosed conflict agent. Groq may receive a rolling RAM window of live-room text **while the room is open**. Avelis does not store that window. The path is shown to every party before they speak. The Host must not run a session with the agent on if the Host cannot accept that disclosure.

### 8. International transfers

If a subprocessor is outside the Host’s jurisdiction, transfers are only those in Annex II. Avelis does not claim a specific adequacy finding in this evaluation form. The Host’s counsel decides whether that is acceptable for the ninety days. For conversion, name the transfer tool in writing (SCCs, adequacy, or Host-operated residency).

### 9. Assistance, rights requests, DPIA

Because room talk is not retained, Avelis **cannot** fulfill a request to produce, correct, or delete a transcript of the session. It can:

- delete or correct facilitator account data on instruction;
- confirm whether a named delivery address is still held (it should not be, after join);
- produce the process ledger and any joint minute still within retention, to the Host;
- produce a destruction receipt after purge.

The Host answers data-subject requests. Avelis assists with the objects it actually has. Avelis will tell the Host if a request comes in directly.

Avelis will assist with a DPIA only as to the architecture in Annex I and III — not as a claim that the Host’s matter is privileged.

### 10. Breach

Avelis will notify the Host within **seventy-two (72) hours** of confirming a personal-data breach affecting retained process records or facilitator accounts.

Historical room talk cannot be exfiltrated from Avelis because it is not kept. That sentence is architecture, not a promise that no other system (the Host’s laptop, a party’s device) was copied.

### 11. Destruction and return

At the Host-set retention deadline, Avelis destroys session-scoped retained data: ledger lines, party records, agenda, joint-minute content, session metadata. A destruction receipt remains.

There is no undelete. Export of a joint minute is generated in the Host’s client or in the response; Avelis does not keep the exported file.

At the end of the evaluation, facilitator-account data is deleted on written instruction, except records Avelis must keep under law (for example, a billed invoice if conversion occurred — none is expected during evaluation).

### 12. Audit

During evaluation, audit is: this packet, the in-product destruction receipt, and a founder walkthrough of the session lifecycle. Avelis will not invent a transcript to satisfy an auditor. After conversion, a reasonable written questionnaire plus evidence of KMS configuration is the default; on-site audit only if required by the Host’s regulator and scoped to process records, not speech Avelis does not have.

### 13. What this packet does not do

Avelis does not claim attorney–client privilege, mediator privilege, or subpoena immunity. A court can still order the **Host** to testify about what happened in the room. Avelis can say, truthfully: we cannot produce a transcript we never made.

Avelis is not the mediator of record, not counsel, and not a party.

### 14. Liability (evaluation)

Liability under this packet during the ninety-day evaluation is limited to direct damages caused by Avelis’s material breach of sections 2–7 and 10–11, capped at **one thousand US dollars (USD 1,000)**, except for willful misconduct or a breach of confidentiality as to retained process records. No consequential damages. This cap is for evaluation only and must be rewritten at conversion.

### 15. Law

The Host’s principal place of business, unless the parties write otherwise. This is an evaluation form, not a forum-shopping exercise.

### 16. Signatures

Each person signing may bind that side to this evaluation DPA.

| | Host | Avelis |
|---|---|---|
| Name | | Tyler Brasseaux |
| Title | | Founder & systems architect |
| Signature | | |
| Date | | |

---

# Annex I — Processing description (what exists)

The product object is a **session**.

1. **Draft.** Host sets retention (0–30 days). Invites are one-time codes. Optional delivery email is for sending the code only.
2. **Open.** The live room exists. Messages are delivered to connected clients and dropped. They are not written to disk, not logged, not exported.
3. **Agent (optional, disclosed).** Named mediation moves. A RAM window may go to Groq. No model writes the ledger.
4. **Caucus.** RAM isolation. Plenary pauses. A process fact may return; quotes do not.
5. **Clock.** Visible budget. Elapsed does not close the room and does not write speech.
6. **Voice (optional).** Browser-to-browser mesh. Signaling may ride the room socket. Audio frames do not. No SFU at Avelis.
7. **Close.** Room process is destroyed. Messages cannot be recovered.
8. **Retain.** Ledger and optional minute until the deadline.
9. **Destroy.** Bodies gone. Destruction receipt remains (hashes, timestamps, final sequence). Not a SNARK. Not a transcript.

Identity classes (named, role-only, affiliation-only, unnamed) are chosen at invite and lock at join.

---

# Annex II — Subprocessors

| Party | Role | Personal data | Sees live speech? | Location (typical) |
|---|---|---|---|---|
| Host infrastructure, or Avelis-operated host | Compute; Postgres for process records | Ledger, minute, facilitator account | No retained speech | Named at conversion |
| **Groq** | Optional inference for the disclosed conflict agent | RAM window of live text while the room is open | Transient, if the agent is on | United States |
| SMTP provider (only if configured) | One-time invite mail | Invite code; recipient address | No | Named if used |
| STUN (Cloudflare default, or Host-chosen) | NAT for optional mesh voice | Network addresses | No audio | Global anycast |

AWS, a mail vendor, or a DNS provider appear in the production list **only when that host actually uses them**. This evaluation form does not invent a SOC 2 report or a region.

**Groq — Host acknowledgement**

By signing Part A, the Host acknowledges: if the conflict agent is enabled, Groq is a subprocessor for a RAM window of session text; parties will see that disclosure; Avelis does not keep the window; the Host will not treat Groq as a silent listener.

If the Host cannot accept Groq, the Host runs sessions with inference off. The room, ledger, caucus, clock, and mesh still operate.

---

# Annex III — Technical and organizational measures (honest)

| Measure | What is true |
|---|---|
| Live room | In-process memory. HMAC room tokens. No server scrollback. Teardown on close. |
| Voice | Peer-to-peer. No recording API. Pauses with caucus. |
| Ledger | Closed vocabulary. Hash-chained. Encrypted at rest. Destroyed at deadline. |
| Keys | Production refuses the local stub. AWS KMS key IDs required at boot. |
| Exports | Joint-minute PDF/markdown built in the client or the HTTP response. File not retained. |
| Logs | Speech-free. No invite codes. Delivery address reduced to domain in operational logs if logged at all. |
| Access | Founder-operated evaluation. No standing party accounts. |
| Testing | Automated tests that fail if speech would be stored or logged. |

Avelis does not claim “cryptographic shredding” of RAM as a legal control. Process exit and drop is the room model.

---

# Annex IV — Companion documents

| Document | Role |
|---|---|
| `loi-mediator.md` | Non-binding 90-day evaluation, three sessions, intent to convert |
| This packet | Processor terms for that evaluation |
| Product constitution (`docs/product-instructions.md`) | What the software is allowed to be |
| In-product DPA page (`/legal/dpa`) | Short form of Annex I |
| Subprocessor page (`/legal/data-processing`) | Short form of Annex II |

If the Host’s counsel needs a transfer tool or a residency clause, that is a conversion item — write it then. Do not stall the first evaluation session on a hypothetical region.

---

*Last updated 13 September 2026. Tyler Brasseaux, founder & systems architect.*
