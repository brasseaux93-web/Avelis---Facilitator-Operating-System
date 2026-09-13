#!/usr/bin/env tsx
/**
 * Design-partner packet. Fills LOI + DPA + first-session sheet.
 *
 *   npx tsx scripts/onboard-partner.ts --name "Jordan Lee" --org "North Shore Mediation" --focus Employment --email jordan@example.com
 */
import fs from 'node:fs';
import path from 'node:path';

type Args = {
  name: string;
  org: string;
  focus: string;
  email: string;
  out?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith('--') && argv[i + 1] && !argv[i + 1]!.startsWith('--')) {
      out[a.slice(2)] = argv[++i]!;
    }
  }
  if (!out.name || !out.org || !out.focus || !out.email) {
    console.error(
      'Usage: tsx scripts/onboard-partner.ts --name "Facilitator" --org "Practice" --focus Employment --email a@b.c [--out ./packet]'
    );
    process.exit(1);
  }
  return out as Args;
}

function loi(a: Args): string {
  return `# Letter of Intent
## Design-partner evaluation of Avelis

**Date:** ${new Date().toISOString().slice(0, 10)}
**Non-binding.** This letter is not a purchase order, not a license, and not exclusive.

**Host (practice / panel / office)**
Legal name: ${a.org}
Primary facilitator: ${a.name}
Email: ${a.email}
Practice focus: ${a.focus}

**Avelis**
Tyler Brasseaux, founder & systems architect

### 1. Purpose
${a.org} intends to evaluate Avelis as the session environment for facilitated ${a.focus.toLowerCase()} talks that must not produce a transcript.

### 2. Evaluation period
Ninety (90) days from signature. No fee. No obligation to buy.

### 3. What Avelis will provide
One organization seat; invite-only parties; deliver-and-drop room; optional disclosed conflict agent (Groq RAM window if configured); process ledger; optional joint minute; destruction receipt; DPA; founder on the first three sessions.

### 4. What ${a.org} will do
At least three real ${a.focus.toLowerCase()} sessions. A short written note after. No request for transcripts, captions, recording, scores, or a party directory.

### 5. Speech
Room messages are not stored. Audio is not recorded. This letter does not create privilege.

### 6. Intent if the chamber holds
One-year organization seat at then-current practice ($14,400) or firm ($54,000) rates. A signed order supersedes this letter.

### 7. Signatures
| | Host | Avelis |
|---|---|---|
| Name | ${a.name} | Tyler Brasseaux |
| Title | | Founder & systems architect |
| Signature | | |
| Date | | |
`;
}

function dpa(a: Args): string {
  return `# Avelis Data Processing Packet (evaluation)
Companion to the Letter of Intent for **${a.org}**.

Controller (Host): ${a.org}, contact ${a.name} <${a.email}>
Processor: Tyler Brasseaux / Avelis Facilitator Operating System
Effective: ninety-day evaluation in the LOI.

The Host is controller of facilitator account data, optional invite addresses, process-ledger labels, and any joint minute. Avelis is processor. Parties have no standing accounts.

**Not retained:** live-room message bodies, audio, captions, transcripts, AI summaries of the talk.

**Conflict agent:** If inference is configured, Groq may receive a RAM window of live text while the room is open. Disclosed to every party. Not stored by Avelis. The agent does not write the ledger. If ${a.org} cannot accept Groq, run inference off.

**Retention:** 0–30 days, locked at open, then destruction receipt. No undelete.

**Subprocessors:** Host compute; Groq (optional RAM window); SMTP if configured (invite code only); STUN (addresses, not audio).

**What we will not say:** Avelis does not claim privilege or subpoena immunity. We cannot produce a transcript we never made.

**Evaluation liability cap:** USD 1,000 except willful misconduct.

| | Host | Avelis |
|---|---|---|
| Name | ${a.name} | Tyler Brasseaux |
| Signature | | |
| Date | | |
`;
}

function firstSession(a: Args): string {
  return `# First session — 8 minutes
For ${a.name} at ${a.org} (${a.focus}).

1. \`npm run demo:evaluation\` (or open the evaluation seat you were given).
2. Three tabs: facilitator console, Party Alpha, Party Beta.
3. Wait for the opening ritual. Avelis is visible.
4. Speak one interest each in plenary. Do not bargain positions yet.
5. Facilitator: private turn with Alpha. Beta must see no payload from that turn.
6. Return with one process fact — e.g. “Coverage on nights”. Quotes are blocked.
7. Close. There is no transcript. If you need a file of the talk, stop; this is the wrong product.

Room messages are delivered live and are not stored by Avelis.
`;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  const slug = a.org.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dir = path.resolve(a.out || path.join('artifacts', 'partners', slug));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'LOI-Evaluation.md'), loi(a));
  fs.writeFileSync(path.join(dir, 'DPA-Packet.md'), dpa(a));
  fs.writeFileSync(path.join(dir, 'First-Session.md'), firstSession(a));
  console.log(`Wrote packet for ${a.org}:`);
  console.log(`  ${path.join(dir, 'LOI-Evaluation.md')}`);
  console.log(`  ${path.join(dir, 'DPA-Packet.md')}`);
  console.log(`  ${path.join(dir, 'First-Session.md')}`);
}

main();
