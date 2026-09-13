import crypto from 'node:crypto';
import { eq, lte, and, asc } from 'drizzle-orm';
import { db } from '../db/index';
import {
  sessions,
  ledgerLines,
  jointMinutes,
  agendaItems,
  parties,
  destructionReceipts,
} from '../db/schema';
import { computeLineHash, computePayloadDigest } from '../lib/ledger';

/**
 * Product Law L5: Destruction is a feature.
 * Aligns to destructionReceipts schema fields only.
 * Verifies full hash chain before purge when lines exist.
 * Do not log session content.
 */
export async function runDestructionCron() {
  console.log('[Destruction Worker] Running chronological deletion sweep...');
  const now = new Date();

  try {
    const expiredSessions = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.status, 'closed'), lte(sessions.retentionExpiresAt, now)));

    if (expiredSessions.length === 0) {
      console.log('[Destruction Worker] No expired sessions found.');
      return;
    }

    for (const session of expiredSessions) {
      console.log(`[Destruction Worker] Purging session id=${session.id}`);

      await db.transaction(async (tx) => {
        const lines = await tx
          .select({
            sequenceNumber: ledgerLines.sequenceNumber,
            lineHash: ledgerLines.lineHash,
            previousLineHash: ledgerLines.previousLineHash,
            lineType: ledgerLines.lineType,
            payloadDigest: ledgerLines.payloadDigest,
          })
          .from(ledgerLines)
          .where(eq(ledgerLines.sessionId, session.id))
          .orderBy(asc(ledgerLines.sequenceNumber));

        let finalSequenceNumber = 0;
        let ledgerRootHash = 'genesis';

        if (lines.length > 0) {
          let previous: string | null = null;
          for (const line of lines) {
            const expected = computeLineHash(
              session.id,
              line.sequenceNumber,
              line.lineType,
              line.payloadDigest,
              previous
            );
            if (expected !== line.lineHash || line.previousLineHash !== previous) {
              throw new Error(`Ledger integrity check failed for session ${session.id}`);
            }
            previous = line.lineHash;
          }
          const tip = lines[lines.length - 1]!;
          finalSequenceNumber = tip.sequenceNumber;
          ledgerRootHash = tip.lineHash;
        }

        const bodiesDestroyed = [
          'ledger_lines',
          'joint_minutes',
          'agenda_items',
          'parties',
          'session_content',
        ];

        const retentionWindow = `${session.retentionHours}h`;
        const purgedAt = new Date();

        const manifest = {
          sessionId: session.id,
          organizationId: session.organizationId,
          purgedAt: purgedAt.toISOString(),
          retentionWindow,
          bodiesDestroyed,
          finalSequenceNumber,
          ledgerRootHash,
        };
        const destructionManifestDigest = computePayloadDigest(manifest);
        const signature = crypto
          .createHmac('sha256', process.env.LOCAL_DEV_SIGNING_KEY || 'local-dev-signing-key')
          .update(destructionManifestDigest, 'utf8')
          .digest('hex');

        await tx.insert(destructionReceipts).values({
          sessionId: session.id,
          organizationId: session.organizationId,
          purgedAt,
          retentionWindow,
          bodiesDestroyed,
          finalSequenceNumber,
          ledgerRootHash,
          destructionManifestDigest,
          attestedByKind: 'system',
          signature,
        });

        await tx.delete(ledgerLines).where(eq(ledgerLines.sessionId, session.id));
        await tx.delete(jointMinutes).where(eq(jointMinutes.sessionId, session.id));
        await tx.delete(agendaItems).where(eq(agendaItems.sessionId, session.id));
        await tx.delete(parties).where(eq(parties.sessionId, session.id));

        await tx
          .update(sessions)
          .set({
            status: 'purged',
            title: '[PURGED]',
            retentionExpiresAt: null,
            purgedAt,
            updatedAt: purgedAt,
          })
          .where(eq(sessions.id, session.id));
      });

      console.log(`[Destruction Worker] Session ${session.id} purged successfully.`);
    }
  } catch (error) {
    console.error('[Destruction Worker] Error during sweep:', error);
  }
}
