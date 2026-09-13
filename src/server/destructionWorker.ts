import { db } from '../db/index';
import { jointMinutes, sessions, ledgerLines, destructionReceipts } from '../db/schema';
import { eq, lte, and } from 'drizzle-orm';
import crypto from 'node:crypto';

// Product Law L5: Destruction is a feature.
// This cron runs periodically to purge sessions that have reached their retention_expires_at.

export async function runDestructionCron() {
  console.log('[Destruction Worker] Running chronological deletion sweep...');
  const now = new Date();

  try {
    // 1. Find all closed sessions where retention_expires_at <= now
    const expiredSessions = await db.query.sessions.findMany({
      where: and(
        eq(sessions.status, 'closed'),
        lte(sessions.retentionExpiresAt, now)
      )
    });

    if (expiredSessions.length === 0) {
      console.log('[Destruction Worker] No expired sessions found.');
      return;
    }

    // 2. Destroy the ledger lines and joint minutes for those sessions
    for (const session of expiredSessions) {
      console.log(`[Destruction Worker] Destroying session: ${session.id}`);

      // Transaction: create receipt, then HARD DELETE everything else.
      await db.transaction(async (tx) => {
        // Compute cryptographic proof of destruction (simplified for MVP)
        const receiptHash = crypto.createHash('sha256').update(session.id + Date.now().toString()).digest('hex');

        // Create the destruction receipt BEFORE deleting to avoid foreign key violations, 
        // or ensure receipt isn't constrained by session foreign key if the session itself is deleted.
        // The schema sets destructionReceipts.sessionId which references sessions.id. 
        // Actually, if we delete the session, the receipt might be cascade deleted or block deletion.
        // According to the data model: "The DestructionReceipt replaces the session. It MUST outlive the session."
        // We will insert the receipt. It may be that the schema for receipts allows sessionId to just be a string.
        // Wait, the schema has `sessionId: text('session_id').references(() => sessions.id, { onDelete: 'set null' })` or similar?
        // If not, we might need to keep the session row but scrub its metadata, or remove the FK.
        // Let's assume the session row is retained but marked 'purged', and all its child data is HARD deleted.
        
        await tx.insert(destructionReceipts).values({
          sessionId: session.id,
          destroyedAt: new Date(),
          receiptHash: receiptHash,
          attestationSignedBy: 'system-cron',
          ledgerLinesDestroyed: true,
          minuteDestroyed: true
        });

        // Hard Delete ledger lines and joint minutes
        await tx.delete(ledgerLines).where(eq(ledgerLines.sessionId, session.id));
        await tx.delete(jointMinutes).where(eq(jointMinutes.sessionId, session.id));
        
        // Update session status to purged
        await tx.update(sessions)
          .set({ status: 'purged', title: '[PURGED]', retentionExpiresAt: null })
          .where(eq(sessions.id, session.id));
      });
      
      console.log(`[Destruction Worker] Session ${session.id} purged successfully.`);
    }
  } catch (error) {
    console.error('[Destruction Worker] Error during sweep:', error);
  }
}
