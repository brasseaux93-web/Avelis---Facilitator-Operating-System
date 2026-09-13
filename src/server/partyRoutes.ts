import express from 'express';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/index';
import { sessions, ledgerLines, jointMinutes } from '../db/schema';
import { verifyPartySessionToken } from '../lib/auth';
import { appendLedgerLine } from '../lib/ledgerAppend';
import { getJointMinute } from './minute';

declare global {
  namespace Express {
    interface Request {
      partyId?: string;
      partySessionId?: string;
    }
  }
}

const requirePartyAuth: express.RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Party credentials are missing.' });
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyPartySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Party credentials are missing.' });
  }
  req.partyId = payload.partyId;
  req.partySessionId = payload.sessionId;
  next();
};

export function computePartyVisibleLines(
  lines: Array<{
    id: string;
    sequenceNumber: number;
    lineType: string;
    initialVisibility: string;
    payload: Record<string, unknown>;
    occurredAt: Date | string;
  }>
) {
  const visible = new Set<string>();
  for (const line of lines) {
    if (line.initialVisibility === 'party_visible') {
      visible.add(line.id);
    }
    if (line.lineType === 'ledger_line_published') {
      const target =
        (typeof line.payload.lineId === 'string' && line.payload.lineId) ||
        (typeof line.payload.target_line_id === 'string' && line.payload.target_line_id) ||
        null;
      if (target) visible.add(target);
    }
    if (line.lineType === 'ledger_line_withdrawn_from_party_view') {
      const target =
        (typeof line.payload.lineId === 'string' && line.payload.lineId) ||
        (typeof line.payload.target_line_id === 'string' && line.payload.target_line_id) ||
        null;
      if (target) visible.delete(target);
    }
  }
  return lines
    .filter((l) => visible.has(l.id))
    .map((l) => ({
      id: l.id,
      sequenceNumber: l.sequenceNumber,
      lineType: l.lineType,
      occurredAt: l.occurredAt,
      initialVisibility: l.initialVisibility,
    }));
}

export function registerPartyRoutes(app: express.Express) {
  app.get('/api/party/session/ledger', requirePartyAuth, async (req, res) => {
    const sessionId = req.partySessionId!;
    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      if (session.status === 'purged') {
        return res.status(410).json({
          error: 'Session records were destroyed. The destruction receipt remains.',
          lines: [],
        });
      }
      const lines = await db
        .select({
          id: ledgerLines.id,
          sequenceNumber: ledgerLines.sequenceNumber,
          lineType: ledgerLines.lineType,
          initialVisibility: ledgerLines.initialVisibility,
          payload: ledgerLines.payload,
          occurredAt: ledgerLines.occurredAt,
        })
        .from(ledgerLines)
        .where(eq(ledgerLines.sessionId, sessionId))
        .orderBy(asc(ledgerLines.sequenceNumber));
      const visible = computePartyVisibleLines(
        lines.map((l) => ({
          ...l,
          payload: (l.payload || {}) as Record<string, unknown>,
        }))
      );
      res.status(200).json({
        sessionId,
        lines: visible,
        emptyState:
          visible.length === 0 ? 'No process lines are visible to parties yet.' : undefined,
      });
    } catch (error) {
      console.error('[API] party ledger failed', error);
      res.status(500).json({ error: 'Could not list party ledger.' });
    }
  });

  app.get('/api/party/session/minute', requirePartyAuth, async (req, res) => {
    const sessionId = req.partySessionId!;
    try {
      const minute = await getJointMinute(sessionId);
      if (!minute || minute.status !== 'published' || !minute.content) {
        return res.status(200).json({
          minute: null,
          emptyState: 'No joint minute is published for parties.',
        });
      }
      res.status(200).json({
        minute: {
          id: minute.id,
          status: minute.status,
          content: minute.content,
          contentDigest: minute.contentDigest,
          initialedBy: minute.initialedBy || [],
        },
      });
    } catch (error) {
      console.error('[API] party minute failed', error);
      res.status(500).json({ error: 'Could not load joint minute.' });
    }
  });

  app.post('/api/sessions/:id/minute/initial', requirePartyAuth, async (req, res) => {
    const sessionId = req.params.id;
    const partyId = req.partyId!;
    if (req.partySessionId !== sessionId) {
      return res.status(403).json({ error: 'Not authorized for this session.' });
    }
    try {
      const minute = await getJointMinute(sessionId);
      if (!minute || minute.status !== 'published' || !minute.contentDigest) {
        return res.status(404).json({ error: 'Published joint minute not found.' });
      }
      const already = (minute.initialedBy || []).includes(partyId);
      if (already) {
        return res.status(200).json({
          id: minute.id,
          status: minute.status,
          initialedBy: minute.initialedBy,
          alreadyInitialed: true,
        });
      }
      const nextInitialed = [...(minute.initialedBy || []), partyId];
      const [updated] = await db
        .update(jointMinutes)
        .set({ initialedBy: nextInitialed, updatedAt: new Date() })
        .where(eq(jointMinutes.id, minute.id))
        .returning();
      await db.transaction(async (tx) => {
        await appendLedgerLine(tx, {
          sessionId,
          lineType: 'joint_minute_initialed',
          payload: {
            minuteId: minute.id,
            partyId,
            contentDigest: minute.contentDigest,
          },
          actorKind: 'party',
          actorRef: partyId,
          source: 'party_ui',
          initialVisibility: 'party_visible',
        });
      });
      res.status(200).json({
        id: updated.id,
        status: updated.status,
        initialedBy: updated.initialedBy,
        alreadyInitialed: false,
      });
    } catch (error) {
      console.error('[API] minute initial failed', error);
      res.status(500).json({ error: 'Could not record minute initial.' });
    }
  });
}
