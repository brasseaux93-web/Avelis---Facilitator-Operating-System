#!/usr/bin/env tsx
/**
 * Turnkey evaluation seed. Prints three browser links. No speech is stored.
 *
 *   npm run demo:evaluation
 */
import { loadLocalEnv } from '../src/lib/loadEnv';

loadLocalEnv();

import { db } from '../src/db/index';
import { sessions, parties, agendaItems } from '../src/db/schema';
import { ensureDevFacilitatorSeed, SEED_FACILITATOR_ID, SEED_ORG_ID } from '../src/server/seedDev';
import { generateInviteCode } from '../src/lib/invite';
import { appendLedgerLine } from '../src/lib/ledgerAppend';

const ORIGIN = (process.env.PUBLIC_APP_ORIGIN || process.env.APP_ORIGIN || 'http://127.0.0.1:5173').replace(
  /\/$/,
  ''
);
const TITLE = 'Evaluation: night-shift coverage';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required. Start Postgres, then retry.');
    process.exit(1);
  }
  process.env.ENABLE_DEMO_SEED = process.env.ENABLE_DEMO_SEED || 'true';
  await ensureDevFacilitatorSeed();

  const [session] = await db
    .insert(sessions)
    .values({
      organizationId: SEED_ORG_ID,
      facilitatorId: SEED_FACILITATOR_ID,
      title: TITLE,
      retentionHours: 24,
      status: 'open',
      openedAt: new Date(),
    })
    .returning();

  await db.transaction(async (tx) => {
    await appendLedgerLine(tx, {
      sessionId: session.id,
      lineType: 'session_opened',
      payload: { title: TITLE, evaluation: true },
      actorKind: 'system',
      source: 'application_server',
      initialVisibility: 'facilitator_only',
    });
  });

  const alpha = generateInviteCode();
  const beta = generateInviteCode();
  await db.insert(parties).values([
    {
      sessionId: session.id,
      identityClass: 'role_only',
      displayLabel: 'Party Alpha (operations)',
      inviteCodeHash: alpha.hash,
      inviteStatus: 'pending',
    },
    {
      sessionId: session.id,
      identityClass: 'role_only',
      displayLabel: 'Party Beta (staffing)',
      inviteCodeHash: beta.hash,
      inviteStatus: 'pending',
    },
  ]);

  await db.insert(agendaItems).values([
    { sessionId: session.id, title: 'Night-shift coverage on weekends', sortOrder: 0, status: 'tabled' },
    { sessionId: session.id, title: 'Who owns overtime authorization', sortOrder: 1, status: 'tabled' },
    { sessionId: session.id, title: 'A workable rotation, not a winner', sortOrder: 2, status: 'tabled' },
  ]);

  const email = process.env.FACILITATOR_SEED_EMAIL || 'facilitator@avelis.local';
  const groq = process.env.GROQ_API_KEY ? 'Groq RAM window enabled (disclosed)' : 'Groq not configured — playbook only';

  console.log('');
  console.log('Avelis evaluation session is open. Room talk is not stored.');
  console.log(`Session: ${session.id}`);
  console.log(`Agent:   ${groq}`);
  console.log('');
  console.log('1. Facilitator console');
  console.log(`   ${ORIGIN}/sessions/${session.id}`);
  console.log(`   Sign in: ${email}  (dev password is not printed)`);
  console.log('');
  console.log('2. Party Alpha  — join code (once)');
  console.log(`   ${ORIGIN}/join`);
  console.log(`   Code: ${alpha.code}`);
  console.log('');
  console.log('3. Party Beta   — join code (once)');
  console.log(`   ${ORIGIN}/join`);
  console.log(`   Code: ${beta.code}`);
  console.log('');
  console.log('Eight-minute path: open the three tabs → wait for the opening ritual');
  console.log('→ facilitator starts a private turn with Alpha → return with “Coverage on nights”');
  console.log('→ close the session. Do not look for a transcript. There is not one.');
  console.log('');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
