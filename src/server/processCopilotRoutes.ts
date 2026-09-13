import express from 'express';
import crypto from 'node:crypto';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/index';
import { sessions, parties, agendaItems, ledgerLines, jointMinutes } from '../db/schema';
import { advise, ask, copilotStatus } from '../lib/processCopilot';
import { appendLedgerLine } from '../lib/ledgerAppend';
import { logEvent } from '../lib/observability';

const consultHits = new Map<string, { count: number; resetAt: number }>();
const CONSULT_MAX = 30;
const CONSULT_WINDOW_MS = 60 * 60 * 1000;

function consultLimited(facilitatorId: string): boolean {
  const now = Date.now();
  const entry = consultHits.get(facilitatorId);
  if (!entry || now > entry.resetAt) {
    consultHits.set(facilitatorId, { count: 1, resetAt: now + CONSULT_WINDOW_MS });
    return false;
  }
  if (entry.count >= CONSULT_MAX) return true;
  entry.count += 1;
  return false;
}

async function loadAdviseInput(sessionId: string) {
  const [partyRows, agendaRows, lines, minutes] = await Promise.all([
    db
      .select({
        identityClass: parties.identityClass,
        inviteStatus: parties.inviteStatus,
      })
      .from(parties)
      .where(eq(parties.sessionId, sessionId)),
    db
      .select({
        id: agendaItems.id,
        title: agendaItems.title,
        status: agendaItems.status,
      })
      .from(agendaItems)
      .where(eq(agendaItems.sessionId, sessionId)),
    db
      .select({
        lineType: ledgerLines.lineType,
        payload: ledgerLines.payload,
      })
      .from(ledgerLines)
      .where(eq(ledgerLines.sessionId, sessionId))
      .orderBy(asc(ledgerLines.sequenceNumber)),
    db.select().from(jointMinutes).where(eq(jointMinutes.sessionId, sessionId)).limit(1),
  ]);

  const processMarkPayloads = lines
    .filter((l) => l.lineType === 'process_mark_recorded')
    .map((l) => (l.payload as { mark?: string })?.mark);

  return {
    parties: partyRows,
    agenda: agendaRows,
    ledgerLineTypes: lines.map((l) => l.lineType),
    minuteStatus: minutes[0]?.status ?? null,
    processMarkPayloads,
  };
}

export function registerProcessCopilotRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  app.get('/api/process-copilot/status', requireAuth, (_req, res) => {
    const status = copilotStatus();
    res.status(200).json({
      configured: status.configured,
      provider: status.provider,
      model: status.configured ? status.model : null,
      disclosure:
        'Process copilot uses session process facts only. It does not read the live room. It does not write the ledger.',
    });
  });

  app.post('/api/sessions/:id/process-copilot', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;
    if (consultLimited(facilitatorId)) {
      return res.status(429).json({ error: 'Process copilot rate limit reached. Try again later.' });
    }

    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }

      const input = await loadAdviseInput(sessionId);
      const result = await advise({ sessionStatus: session.status, ...input });

      logEvent('info', 'process_copilot_consulted', {
        requestId: typeof res.getHeader('x-request-id') === 'string' ? String(res.getHeader('x-request-id')) : undefined,
        source: result.source,
        stage: result.stage,
        actionCount: result.actions.length,
      });

      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not run process copilot.';
      if (message.includes('forbidden') || message.includes('speech')) {
        return res.status(400).json({ error: 'Process copilot refused a snapshot that was not process-only.' });
      }
      console.error('[API] process copilot failed', error);
      res.status(500).json({ error: 'Could not run process copilot.' });
    }
  });

  app.post('/api/sessions/:id/process-copilot/turn', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;
    const question = typeof req.body?.question === 'string' ? req.body.question : '';
    if (consultLimited(facilitatorId)) {
      return res.status(429).json({ error: 'Process copilot rate limit reached. Try again later.' });
    }
    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }
      const input = await loadAdviseInput(sessionId);
      const result = await ask({ sessionStatus: session.status, ...input }, question);
      logEvent('info', 'process_copilot_turn', {
        source: result.source,
        refused: result.refused,
      });
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not complete process turn.';
      if (message.includes('forbidden') || message.includes('speech')) {
        return res.status(400).json({ error: 'Process copilot refused a snapshot that was not process-only.' });
      }
      console.error('[API] process copilot turn failed', error);
      res.status(500).json({ error: 'Could not complete process turn.' });
    }
  });

  app.post('/api/sessions/:id/process-marks', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;
    const mark = req.body?.mark;
    const allowed = new Set(['pause_called', 'return_to_plenary', 'process_complete']);
    if (!allowed.has(mark)) {
      return res.status(400).json({ error: 'mark must be pause_called|return_to_plenary|process_complete' });
    }
    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }
      if (session.status !== 'open') {
        return res.status(409).json({ error: 'Process marks can be recorded only while the session is open.' });
      }
      const line = await db.transaction(async (tx) =>
        appendLedgerLine(tx, {
          sessionId,
          lineType: 'process_mark_recorded',
          payload: { mark },
          actorKind: 'facilitator',
          actorRef: facilitatorId,
          source: 'facilitator_ui',
          initialVisibility: 'facilitator_only',
        })
      );
      res.status(201).json(line);
    } catch (error) {
      console.error('[API] process mark failed', error);
      res.status(500).json({ error: 'Could not record process mark.' });
    }
  });

  app.post('/api/sessions/:id/caucus', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;
    const action = req.body?.action;
    if (action !== 'open' && action !== 'close') {
      return res.status(400).json({ error: 'action must be open|close' });
    }
    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }
      if (session.status !== 'open') {
        return res.status(409).json({ error: 'Caucus boundaries can change only while the session is open.' });
      }
      const caucusId = crypto.randomUUID();
      const line = await db.transaction(async (tx) =>
        appendLedgerLine(tx, {
          sessionId,
          lineType: action === 'open' ? 'caucus_opened' : 'caucus_closed',
          payload: { caucusId },
          actorKind: 'facilitator',
          actorRef: facilitatorId,
          source: 'facilitator_ui',
          initialVisibility: 'facilitator_only',
        })
      );
      res.status(201).json(line);
    } catch (error) {
      console.error('[API] caucus failed', error);
      res.status(500).json({ error: 'Could not update caucus.' });
    }
  });
}
