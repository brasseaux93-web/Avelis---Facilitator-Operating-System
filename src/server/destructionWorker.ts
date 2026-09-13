import { eq, lte, and, asc, lt } from 'drizzle-orm';
import { db } from '../db/index';
import {
  sessions,
  ledgerLines,
  jointMinutes,
  agendaItems,
  parties,
  destructionReceipts,
  securityAuditEvents,
} from '../db/schema';
import { computeLineHash, computePayloadDigest } from '../lib/ledger';
import { getKms } from '../lib/encryption';
import { incrementMetric, logEvent } from '../lib/observability';
import { resolveSecurityAuditRetentionHours } from '../lib/securityAudit';

/**
 * Product Law L5: Destruction is a feature.
 * Aligns to destructionReceipts schema fields only.
 * Verifies full hash chain before purge when lines exist.
 * Also purges expired security_audit_events (30d default / 90d max).
 * Do not log session content.
 */

export async function purgeExpiredSecurityAuditEvents(
  now: Date = new Date()
): Promise<number> {
  const hours = resolveSecurityAuditRetentionHours();
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const deleted = await db
    .delete(securityAuditEvents)
    .where(lt(securityAuditEvents.createdAt, cutoff))
    .returning({ id: securityAuditEvents.id });
  const count = deleted.length;
  if (count > 0) {
    incrementMetric('security_audit_purged', count);
    logEvent('info', 'security_audit_purge', { purgedCount: count, retentionHours: hours });
  }
  return count;
}

/** Rebuild + verify a destruction receipt signature (local or aws KMS). */
export async function verifyDestructionReceipt(receipt: {
  sessionId: string;
  organizationId: string;
  purgedAt: Date | string;
  retentionWindow: string;
  bodiesDestroyed: string[];
  finalSequenceNumber: number;
  ledgerRootHash: string;
  destructionManifestDigest: string;
  signature: string;
}): Promise<boolean> {
  const purgedAtIso =
    typeof receipt.purgedAt === 'string'
      ? receipt.purgedAt
      : receipt.purgedAt.toISOString();
  const manifest = {
    sessionId: receipt.sessionId,
    organizationId: receipt.organizationId,
    purgedAt: purgedAtIso,
    retentionWindow: receipt.retentionWindow,
    bodiesDestroyed: receipt.bodiesDestroyed,
    finalSequenceNumber: receipt.finalSequenceNumber,
    ledgerRootHash: receipt.ledgerRootHash,
  };
  const digest = computePayloadDigest(manifest);
  if (digest !== receipt.destructionManifestDigest) return false;

  const kms = getKms();
  const signingKeyId =
    process.env.AWS_KMS_SIGNING_KEY_ID ||
    process.env.LOCAL_DEV_SIGNING_KEY ||
    'local-dev-signing-key';
  try {
    return await kms.verify(
      signingKeyId,
      Buffer.from(digest, 'hex'),
      Buffer.from(receipt.signature, 'hex')
    );
  } catch {
    return false;
  }
}

export async function runDestructionCron() {
  logEvent('info', 'destruction_sweep_start');
  const now = new Date();

  try {
    await purgeExpiredSecurityAuditEvents(now);

    const expiredSessions = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.status, 'closed'), lte(sessions.retentionExpiresAt, now)));

    if (expiredSessions.length === 0) {
      logEvent('info', 'destruction_sweep_empty');
      return;
    }

    const kms = getKms();
    const signingKeyId =
      process.env.AWS_KMS_SIGNING_KEY_ID ||
      process.env.LOCAL_DEV_SIGNING_KEY ||
      'local-dev-signing-key';

    for (const session of expiredSessions) {
      logEvent('info', 'destruction_purge_session', {
        sessionId: session.id,
        organizationId: session.organizationId,
      });

      try {
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
                throw new Error('Ledger integrity check failed for session ' + session.id);
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

          const retentionWindow = String(session.retentionHours) + 'h';
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
          const signatureBuf = await kms.sign(
            signingKeyId,
            Buffer.from(destructionManifestDigest, 'hex')
          );
          const signature = signatureBuf.toString('hex');

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

        incrementMetric('purge_success');
        logEvent('info', 'destruction_purge_success', { sessionId: session.id });
      } catch (sessionErr) {
        incrementMetric('purge_failure');
        logEvent('error', 'destruction_purge_failure', {
          sessionId: session.id,
          error: sessionErr instanceof Error ? sessionErr.message : 'unknown',
        });
        throw sessionErr;
      }
    }
  } catch (error) {
    logEvent('error', 'destruction_sweep_error', {
      error: error instanceof Error ? error.message : 'unknown',
    });
  }
}
