import express from 'express';
import { eq, desc, asc } from 'drizzle-orm';
import { db } from '../db/index';
import {
  sessions,
  parties,
  agendaItems,
} from '../db/schema';
import { appendLedgerLine } from '../lib/ledgerAppend';
import { getJointMinute } from './minute';
import { createRoomToken } from '../lib/auth';

export function registerSessionListOpenRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
app.get('/api/sessions', requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.facilitatorId, req.facilitatorId!))
      .orderBy(desc(sessions.createdAt));
    res.status(200).json(rows);
  } catch (error) {
    console.error('[API] Failed to list sessions', error);
    res.status(500).json({ error: 'Could not list sessions.' });
  }
});

/** Create session in draft status. retentionHours validated 0–720; expiresAt stays null until close. */
app.post('/api/sessions', requireAuth, async (req, res) => {
  const { title, retentionHours } = req.body;
  if (!title || retentionHours == null) {
    return res.status(400).json({ error: 'title and retentionHours are required' });
  }
  const hours = Number(retentionHours);
  if (!Number.isInteger(hours) || hours < 0 || hours > 720) {
    return res.status(400).json({ error: 'retentionHours must be an integer 0–720' });
  }

  const facilitatorId = req.facilitatorId!;
  const organizationId = req.organizationId!;

  try {
    const [newSession] = await db
      .insert(sessions)
      .values({
        organizationId,
        facilitatorId,
        title,
        retentionHours: hours,
        retentionExpiresAt: null,
        status: 'draft',
      })
      .returning();

    res.status(201).json(newSession);
  } catch (error) {
    console.error('[API] Failed to create session', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/** Facilitator session detail with parties + agenda. */
app.get('/api/sessions/:id', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  try {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.facilitatorId !== req.facilitatorId) {
      return res.status(403).json({ error: 'Not authorized for this session.' });
    }

    const partyRows = await db.select().from(parties).where(eq(parties.sessionId, sessionId));
    const agenda = await db
      .select()
      .from(agendaItems)
      .where(eq(agendaItems.sessionId, sessionId))
      .orderBy(asc(agendaItems.sortOrder));
    const minute = await getJointMinute(sessionId);

    res.status(200).json({
      session,
      parties: partyRows.map((p) => ({
        id: p.id,
        identityClass: p.identityClass,
        displayLabel: p.displayLabel,
        inviteStatus: p.inviteStatus,
        joinedAt: p.joinedAt,
      })),
      agenda,
      minute: minute
        ? { id: minute.id, status: minute.status, content: minute.content, updatedAt: minute.updatedAt }
        : null,
    });
  } catch (error) {
    console.error('[API] Failed to get session', error);
    res.status(500).json({ error: 'Could not load session.' });
  }
});

/** Open session: status open, openedAt now; append session_opened + retention_window_set. */
app.post('/api/sessions/:id/open', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const facilitatorId = req.facilitatorId!;

  try {
    const result = await db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .for('update');

      if (!session) {
        return { error: 'not_found' as const };
      }
      if (session.facilitatorId !== facilitatorId) {
        return { error: 'forbidden' as const };
      }
      if (session.status !== 'draft') {
        return { error: 'invalid_state' as const, status: session.status };
      }

      const openedAt = new Date();
      const [updated] = await tx
        .update(sessions)
        .set({ status: 'open', openedAt, updatedAt: openedAt })
        .where(eq(sessions.id, sessionId))
        .returning();

      await appendLedgerLine(tx, {
        sessionId,
        lineType: 'session_opened',
        payload: {},
        actorKind: 'facilitator',
        actorRef: facilitatorId,
        source: 'application_server',
        initialVisibility: 'facilitator_only',
      });

      await appendLedgerLine(tx, {
        sessionId,
        lineType: 'retention_window_set',
        payload: { retentionHours: session.retentionHours },
        actorKind: 'facilitator',
        actorRef: facilitatorId,
        source: 'application_server',
        initialVisibility: 'facilitator_only',
      });

      return { session: updated };
    });

    if ('error' in result && result.error === 'not_found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    if ('error' in result && result.error === 'forbidden') {
      return res.status(403).json({ error: 'Not authorized for this session.' });
    }
    if ('error' in result && result.error === 'invalid_state') {
      return res.status(409).json({ error: `Session cannot be opened from status ${result.status}` });
    }
    res.status(200).json(result.session);
  } catch (error) {
    console.error('[API] Failed to open session', error);
    res.status(500).json({ error: 'Failed to open session' });
  }
});

  /**
   * Mint a host room token for the authenticated facilitator.
   * partyId is the facilitator account id — not a participant row.
   */
  app.post('/api/sessions/:id/room-access', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;
    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }
      if (session.status !== 'open') {
        return res.status(409).json({ error: 'Room access is only available while the session is open.' });
      }
      const roomToken = createRoomToken(sessionId, facilitatorId);
      res.status(200).json({
        sessionId,
        partyId: facilitatorId,
        roomToken,
        identityClass: 'facilitator',
      });
    } catch (error) {
      console.error('[API] Failed to mint room access', error);
      res.status(500).json({ error: 'Could not open live room.' });
    }
  });

}
