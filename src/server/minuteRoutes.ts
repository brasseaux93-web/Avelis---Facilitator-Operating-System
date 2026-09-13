import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { sessions, jointMinutes } from '../db/schema';
import { appendLedgerLine } from '../lib/ledgerAppend';
import { upsertJointMinute, wipeJointMinute, getJointMinute } from './minute';

export function registerMinuteRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
  app.post('/api/sessions/:id/minute', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;
    const { content } = req.body || {};
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }

    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }

      const rows = await upsertJointMinute(sessionId, content, 'draft');
      const minute = Array.isArray(rows) ? rows[0] : rows;

      await db.transaction(async (tx) => {
        await appendLedgerLine(tx, {
          sessionId,
          lineType: 'joint_minute_created',
          payload: { minuteId: minute.id },
          actorKind: 'facilitator',
          actorRef: facilitatorId,
          source: 'facilitator_ui',
          initialVisibility: 'facilitator_only',
          idempotencyKey: `joint_minute_created:${minute.id}`,
        });
      });

      res.status(200).json({
        id: minute.id,
        status: minute.status,
        content: minute.content,
        updatedAt: minute.updatedAt,
      });
    } catch (error) {
      console.error('[API] Failed to upsert minute', error);
      res.status(500).json({ error: 'Could not update joint minute.' });
    }
  });

  app.post('/api/sessions/:id/minute/publish', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;

    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }

      const existing = await getJointMinute(sessionId);
      if (!existing || !existing.content) {
        return res.status(404).json({ error: 'Joint minute draft not found.' });
      }

      const [updated] = await db
        .update(jointMinutes)
        .set({ status: 'published', updatedAt: new Date() })
        .where(eq(jointMinutes.id, existing.id))
        .returning();

      await db.transaction(async (tx) => {
        await appendLedgerLine(tx, {
          sessionId,
          lineType: 'joint_minute_published',
          payload: { minuteId: updated.id },
          actorKind: 'facilitator',
          actorRef: facilitatorId,
          source: 'facilitator_ui',
          initialVisibility: 'party_visible',
        });
      });

      res.status(200).json({ id: updated.id, status: updated.status });
    } catch (error) {
      console.error('[API] Failed to publish minute', error);
      res.status(500).json({ error: 'Could not publish joint minute.' });
    }
  });

  app.post('/api/sessions/:id/minute/wipe', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;

    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }

      const wiped = await wipeJointMinute(sessionId);
      if (!wiped || !wiped[0]) {
        return res.status(404).json({ error: 'Joint minute not found.' });
      }

      await db.transaction(async (tx) => {
        await appendLedgerLine(tx, {
          sessionId,
          lineType: 'joint_minute_wiped',
          payload: { minuteId: wiped[0].id },
          actorKind: 'facilitator',
          actorRef: facilitatorId,
          source: 'facilitator_ui',
          initialVisibility: 'facilitator_only',
        });
      });

      res.status(200).json({ id: wiped[0].id, status: wiped[0].status });
    } catch (error) {
      console.error('[API] Failed to wipe minute', error);
      res.status(500).json({ error: 'Could not wipe joint minute.' });
    }
  });

  /** Export markdown body in response memory only (no disk). */
  app.get('/api/sessions/:id/minute/export.md', requireAuth, async (req, res) => {
    const sessionId = req.params.id;
    const facilitatorId = req.facilitatorId!;

    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.facilitatorId !== facilitatorId) {
        return res.status(403).json({ error: 'Not authorized for this session.' });
      }

      const minute = await getJointMinute(sessionId);
      if (!minute || !minute.content) {
        return res.status(404).json({ error: 'Joint minute not found.' });
      }

      const body = [
        `# Joint minute`,
        ``,
        `Session: ${session.title}`,
        `Status: ${minute.status}`,
        ``,
        minute.content,
        ``,
      ].join('\n');

      await db.transaction(async (tx) => {
        await appendLedgerLine(tx, {
          sessionId,
          lineType: 'joint_minute_exported',
          payload: { minuteId: minute.id, format: 'markdown' },
          actorKind: 'facilitator',
          actorRef: facilitatorId,
          source: 'facilitator_ui',
          initialVisibility: 'facilitator_only',
        });
        await tx
          .update(jointMinutes)
          .set({ lastExportedAt: new Date(), updatedAt: new Date() })
          .where(eq(jointMinutes.id, minute.id));
      });

      res.status(200).type('text/markdown').send(body);
    } catch (error) {
      console.error('[API] Failed to export minute', error);
      res.status(500).json({ error: 'Could not export joint minute.' });
    }
  });
}
