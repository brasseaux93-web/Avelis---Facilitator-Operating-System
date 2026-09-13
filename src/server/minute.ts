import { db } from '../db/index';
import { jointMinutes } from '../db/schema';
import { eq } from 'drizzle-orm';

// The Joint Minute is optional, exportable as PDF/Markdown, and destroyed during purging.

export async function upsertJointMinute(sessionId: string, content: string, status: 'draft' | 'final' = 'draft') {
  // Check if it exists
  const existing = await db.query.jointMinutes.findFirst({
    where: eq(jointMinutes.sessionId, sessionId)
  });

  if (existing) {
    return await db.update(jointMinutes)
      .set({ 
        contentEncrypted: Buffer.from(content), // Mock encryption for now
        status,
        updatedAt: new Date()
      })
      .where(eq(jointMinutes.id, existing.id))
      .returning();
  } else {
    return await db.insert(jointMinutes)
      .values({
        sessionId,
        contentEncrypted: Buffer.from(content), // Mock encryption
        status
      })
      .returning();
  }
}

export async function getJointMinute(sessionId: string) {
  const record = await db.query.jointMinutes.findFirst({
    where: eq(jointMinutes.sessionId, sessionId)
  });
  
  if (!record) return null;
  
  // Decrypt content
  return {
    ...record,
    content: record.contentEncrypted.toString() // Mock decryption
  };
}
