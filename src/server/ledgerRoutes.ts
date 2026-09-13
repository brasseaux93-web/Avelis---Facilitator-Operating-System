import express from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '../db/index';
import { sessions, ledgerLines } from '../db/schema';
import { appendLedgerLine } from '../lib/ledgerAppend';
import { decryptJson } from '../lib/encryption';

export function registerLedgerRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
app.get('/api/sessions/:id/ledger', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  try {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.facilitatorId !== req.facilitatorId) {
      return res.status(403).json({ error: 'Not authorized for this session.' });
    }

    const lines = await db
      .select()
      .from(ledgerLines)
      .where(eq(ledgerLines.sessionId, sessionId))
      .orderBy(asc(ledgerLines.sequenceNumber));

    const decrypted = await Promise.all(
      lines.map(async (line) => ({ ...line, payload: await decryptJson(line.payload) }))
    );
    res.status(200).json(decrypted);
  } catch (error) {
    console.error('[API] Failed to list ledger', error);
    res.status(500).json({ error: 'Could not list ledger.' });
  }
});

/** Visibility only. Generic append is closed — use the specific session routes. */
app.post('/api/sessions/:id/ledger', requireAuth, async (_req, res) => {
  return res.status(405).json({
    error: 'Direct ledger append is closed. Use the session process routes.',
  });
});

/** Publish ledger line to party view. */
app.post('/api/sessions/:id/ledger/publish', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const facilitatorId = req.facilitatorId!;
  const { lineId } = req.body || {};
  if (!lineId) return res.status(400).json({ error: 'lineId is required' });

  try {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.facilitatorId !== facilitatorId) {
      return res.status(403).json({ error: 'Not authorized for this session.' });
    }

    const [line] = await db
      .select()
      .from(ledgerLines)
      .where(and(eq(ledgerLines.id, lineId), eq(ledgerLines.sessionId, sessionId)))
      .limit(1);
    if (!line) return res.status(404).json({ error: 'Ledger line not found' });

    const published = await db.transaction(async (tx) => {
      return appendLedgerLine(tx, {
        sessionId,
        lineType: 'ledger_line_published',
        payload: { lineId, sequenceNumber: line.sequenceNumber },
        actorKind: 'facilitator',
        actorRef: facilitatorId,
        source: 'facilitator_ui',
        initialVisibility: 'party_visible',
      });
    });

    res.status(201).json(published);
  } catch (error) {
    console.error('[API] Failed to publish ledger line', error);
    res.status(500).json({ error: 'Could not publish ledger line.' });
  }
});

/** Withdraw ledger line from party view. */
app.post('/api/sessions/:id/ledger/withdraw', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const facilitatorId = req.facilitatorId!;
  const { lineId } = req.body || {};
  if (!lineId) return res.status(400).json({ error: 'lineId is required' });

  try {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.facilitatorId !== facilitatorId) {
      return res.status(403).json({ error: 'Not authorized for this session.' });
    }

    const [line] = await db
      .select()
      .from(ledgerLines)
      .where(and(eq(ledgerLines.id, lineId), eq(ledgerLines.sessionId, sessionId)))
      .limit(1);
    if (!line) return res.status(404).json({ error: 'Ledger line not found' });

    const withdrawn = await db.transaction(async (tx) => {
      return appendLedgerLine(tx, {
        sessionId,
        lineType: 'ledger_line_withdrawn_from_party_view',
        payload: { lineId, sequenceNumber: line.sequenceNumber },
        actorKind: 'facilitator',
        actorRef: facilitatorId,
        source: 'facilitator_ui',
        initialVisibility: 'facilitator_only',
      });
    });

    res.status(201).json(withdrawn);
  } catch (error) {
    console.error('[API] Failed to withdraw ledger line', error);
    res.status(500).json({ error: 'Could not withdraw ledger line.' });
  }
});

}
