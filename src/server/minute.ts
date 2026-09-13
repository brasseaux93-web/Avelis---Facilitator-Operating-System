import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { jointMinutes } from '../db/schema';
import { computePayloadDigest } from '../lib/ledger';

type MinuteStatus = 'draft' | 'published' | 'wiped';

/**
 * Joint Minute helpers aligned to schema: content, contentDigest, status enum.
 * (Previous scaffolding used contentEncrypted / status 'final' — removed.)
 */
export async function upsertJointMinute(
  sessionId: string,
  content: string,
  status: MinuteStatus = 'draft'
) {
  const contentDigest = computePayloadDigest({ content });
  const existing = await db.query.jointMinutes.findFirst({
    where: eq(jointMinutes.sessionId, sessionId),
  });

  if (existing) {
    return await db
      .update(jointMinutes)
      .set({
        content,
        contentDigest,
        status,
        updatedAt: new Date(),
      })
      .where(eq(jointMinutes.id, existing.id))
      .returning();
  }

  return await db
    .insert(jointMinutes)
    .values({
      sessionId,
      content,
      contentDigest,
      status,
    })
    .returning();
}

export async function getJointMinute(sessionId: string) {
  const record = await db.query.jointMinutes.findFirst({
    where: eq(jointMinutes.sessionId, sessionId),
  });
  if (!record) return null;
  return record;
}

/** Wipe minute body in place (status wiped); full hard-delete happens in destructionWorker. */
export async function wipeJointMinute(sessionId: string) {
  const existing = await db.query.jointMinutes.findFirst({
    where: eq(jointMinutes.sessionId, sessionId),
  });
  if (!existing) return null;
  return await db
    .update(jointMinutes)
    .set({
      content: null,
      contentDigest: null,
      status: 'wiped',
      wipedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(jointMinutes.id, existing.id))
    .returning();
}
