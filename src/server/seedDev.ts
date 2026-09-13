import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { organizations, facilitatorAccounts } from '../db/schema';
import { hashPassword } from '../lib/auth';

/** Fixed UUIDs matching Phase 1 mock auth scaffolding. */
export const SEED_ORG_ID = '00000000-0000-4000-8000-000000000002';
export const SEED_FACILITATOR_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Ensure a development organization + facilitator exist when
 * FACILITATOR_SEED_EMAIL / FACILITATOR_SEED_PASSWORD are set, or when
 * NODE_ENV is development (defaults: facilitator@avelis.local / change-me-now).
 * Does not log passwords.
 */
export async function ensureDevFacilitatorSeed(): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production';
  const email =
    process.env.FACILITATOR_SEED_EMAIL || (isDev ? 'facilitator@avelis.local' : null);
  const password =
    process.env.FACILITATOR_SEED_PASSWORD || (isDev ? 'change-me-now' : null);

  if (!email || !password) {
    return;
  }

  try {
    const [existingFacilitator] = await db
      .select({ id: facilitatorAccounts.id, email: facilitatorAccounts.email })
      .from(facilitatorAccounts)
      .where(eq(facilitatorAccounts.email, email))
      .limit(1);

    if (existingFacilitator) {
      console.log(
        `[seed] Facilitator already present id=${existingFacilitator.id} email=${existingFacilitator.email}`
      );
      return;
    }

    const [existingOrg] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, SEED_ORG_ID))
      .limit(1);

    if (!existingOrg) {
      await db.insert(organizations).values({
        id: SEED_ORG_ID,
        name: 'Avelis Local Dev',
        region: 'local',
        encryptionKeyId: 'local-dev-encryption',
        signingKeyId: 'local-dev-signing',
      });
      console.log(`[seed] Organization created id=${SEED_ORG_ID}`);
    }

    const passwordHash = await hashPassword(password);
    await db.insert(facilitatorAccounts).values({
      id: SEED_FACILITATOR_ID,
      organizationId: SEED_ORG_ID,
      email,
      displayName: 'Local Facilitator',
      passwordHash,
      status: 'active',
    });

    console.log(
      `[seed] Facilitator created id=${SEED_FACILITATOR_ID} email=${email} orgId=${SEED_ORG_ID}`
    );
  } catch (error) {
    console.error('[seed] Could not complete facilitator seed', error);
  }
}
