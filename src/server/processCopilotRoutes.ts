import express from 'express';
import crypto from 'node:crypto';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/index';
import { sessions, parties, agendaItems, ledgerLines, jointMinutes } from '../db/schema';
import { advise } from '../lib/processCopilot';
import { appendLedgerLine } from '../lib/ledgerAppend';
import { logEvent } from '../lib/observability';

export function registerProcessCopilotRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  app.post('/api/sessions/:id/process-copilot', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;

    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }

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
        .map((l) => {
          const p = l.payload as { mark?: string };
          return p?.mark;
        });

      const result = await advise({
        sessionStatus: session.status,
        parties: partyRows,
        agenda: agendaRows,
        ledgerLineTypes: lines.map((l) => l.lineType),
        minuteStatus: minutes[0]?.status ?? null,
        processMarkPayloads,
      });

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
