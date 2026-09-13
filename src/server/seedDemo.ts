import { and, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { sessions } from '../db/schema';
import { ensureDevFacilitatorSeed, SEED_FACILITATOR_ID, SEED_ORG_ID } from './seedDev';

export const DEMO_SESSION_TITLE = 'Investor demo session';

export function isDemoSeedEnabled(): boolean {
  return process.env.ENABLE_DEMO_SEED === 'true';
}

export function isDemoPrepareAllowed(): boolean {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_PREPARE !== 'true') {
    return false;
  }
  return (
    process.env.ENABLE_DEMO_SEED === 'true' ||
    process.env.NODE_ENV !== 'production' ||
    process.env.ALLOW_DEMO_PREPARE === 'true'
  );
}

async function ensureDemoSession(): Promise<string> {
  const [existing] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.facilitatorId, SEED_FACILITATOR_ID),
        eq(sessions.title, DEMO_SESSION_TITLE),
        eq(sessions.status, 'draft')
      )
    )
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(sessions)
    .values({
      organizationId: SEED_ORG_ID,
      facilitatorId: SEED_FACILITATOR_ID,
      title: DEMO_SESSION_TITLE,
      retentionHours: 72,
      retentionExpiresAt: null,
      status: 'draft',
    })
    .returning({ id: sessions.id });

  console.log(`[seed-demo] Draft demo session created id=${created.id}`);
  return created.id;
}

/**
 * Behind ENABLE_DEMO_SEED=true (dev/demo only):
 * ensure facilitator exists; optionally ensure a draft demo session (no speech content).
 */
export async function ensureDemoSeed(): Promise<{
  facilitatorEmail: string | null;
  sessionId: string | null;
}> {
  if (!isDemoSeedEnabled()) {
    return { facilitatorEmail: null, sessionId: null };
  }

  await ensureDevFacilitatorSeed();

  const email =
    process.env.FACILITATOR_SEED_EMAIL ||
    (process.env.NODE_ENV !== 'production' ? 'facilitator@avelis.local' : null);

  const sessionId = await ensureDemoSession();
  return { facilitatorEmail: email, sessionId };
}

export async function prepareDemo(): Promise<{
  facilitatorEmailHint: string;
  sessionId: string | null;
  joinPath: string;
  instructions: string[];
}> {
  await ensureDevFacilitatorSeed();
  const sessionId = await ensureDemoSession();
  const hint =
    process.env.FACILITATOR_SEED_EMAIL ||
    'facilitator@avelis.local';

  return {
    facilitatorEmailHint: hint,
    sessionId,
    joinPath: '/join',
    instructions: [
      'Sign in at /auth with the seed facilitator (password not returned by this API).',
      'Open /sessions or the demo session console when sessionId is present.',
      'Create an invite, copy the one-time code, redeem at /join.',
      'Room messages are delivered live and are not stored by Avelis.',
    ],
  };
}
