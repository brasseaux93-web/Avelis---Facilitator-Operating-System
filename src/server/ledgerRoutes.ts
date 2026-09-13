import express from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '../db/index';
import { sessions, ledgerLines } from '../db/schema';
import { appendLedgerLine } from '../lib/ledgerAppend';

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

    res.status(200).json(lines);
  } catch (error) {
    console.error('[API] Failed to list ledger', error);
    res.status(500).json({ error: 'Could not list ledger.' });
  }
});

/** Append a ledger line transactionally with hash chain. */
app.post('/api/sessions/:id/ledger', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const {
    lineType,
    payload,
    actorKind,
    actorRef,
    source,
    initialVisibility,
    idempotencyKey,
    schemaVersion,
  } = req.body;

  if (!lineType || payload == null) {
    return res.status(400).json({ error: 'lineType and payload are required' });
  }

  const facilitatorId = req.facilitatorId!;

  try {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.facilitatorId !== facilitatorId) {
      return res.status(403).json({ error: 'Not authorized for this session.' });
    }

    const line = await db.transaction(async (tx) => {
      return appendLedgerLine(tx, {
        sessionId,
        lineType,
        payload: typeof payload === 'object' && payload !== null ? payload : { value: payload },
        actorKind: actorKind || 'facilitator',
        actorRef: actorRef || facilitatorId,
        source: source || 'application_server',
        initialVisibility: initialVisibility || 'facilitator_only',
        idempotencyKey: idempotencyKey || null,
        schemaVersion: schemaVersion ?? 1,
      });
    });

    res.status(201).json(line);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to append to ledger';
    if (message.startsWith('Invalid lineType') || message.includes('payload must be')) {
      return res.status(400).json({ error: message });
    }
    console.error('[API] Failed to append ledger line', error);
    res.status(500).json({ error: 'Failed to append to ledger' });
  }
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
