import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { sessions, destructionReceipts } from '../db/schema';
import { verifyDestructionReceipt } from './destructionWorker';

export function registerDestructionReceiptRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  /** Destruction receipt after purge. */
  app.get('/api/sessions/:id/destruction-receipt', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;

    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }
      if (session.status !== 'purged') {
        return res.status(409).json({
          error: 'Destruction receipt is available after session records are destroyed.',
          status: session.status,
        });
      }

      const [receipt] = await db
        .select()
        .from(destructionReceipts)
        .where(eq(destructionReceipts.sessionId, sessionId))
        .limit(1);

      if (!receipt) {
        return res.status(404).json({ error: 'Destruction receipt not found.' });
      }

      res.status(200).json({
        id: receipt.id,
        sessionId: receipt.sessionId,
        organizationId: receipt.organizationId,
        purgedAt: receipt.purgedAt,
        retentionWindow: receipt.retentionWindow,
        bodiesDestroyed: receipt.bodiesDestroyed,
        finalSequenceNumber: receipt.finalSequenceNumber,
        ledgerRootHash: receipt.ledgerRootHash,
        destructionManifestDigest: receipt.destructionManifestDigest,
        attestedByKind: receipt.attestedByKind,
        signature: receipt.signature,
        createdAt: receipt.createdAt,
        disclosure: 'Session records were destroyed. The destruction receipt remains.',
      });
    } catch (error) {
      console.error('[API] destruction receipt failed', error);
      res.status(500).json({ error: 'Could not load destruction receipt.' });
    }
  });

  /** Verify receipt signature + manifest digest. */
  app.get('/api/sessions/:id/destruction-receipt/verify', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;

    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }

      const [receipt] = await db
        .select()
        .from(destructionReceipts)
        .where(eq(destructionReceipts.sessionId, sessionId))
        .limit(1);

      if (!receipt) {
        return res.status(404).json({ valid: false, error: 'Destruction receipt not found.' });
      }

      const valid = await verifyDestructionReceipt(receipt);
      res.status(200).json({ valid, receiptId: receipt.id, sessionId: receipt.sessionId });
    } catch (error) {
      console.error('[API] destruction receipt verify failed', error);
      res.status(500).json({ valid: false, error: 'Could not verify destruction receipt.' });
    }
  });
}
