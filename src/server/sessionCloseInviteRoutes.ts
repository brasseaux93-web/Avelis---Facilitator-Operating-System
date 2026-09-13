import express from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index';
import {
  sessions,
  parties,
  ledgerLines,
  ledgerRoots,
} from '../db/schema';
import { appendLedgerLine } from '../lib/ledgerAppend';
import { generateInviteCode } from '../lib/invite';
import { teardownRoom } from '../room/memory';
import { kms } from '../lib/encryption';
import { computePayloadDigest } from '../lib/ledger';
import { IDENTITY_CLASSES } from './middleware';

export function registerSessionCloseInviteRoutes(
  app: express.Express,
  requireAuth: express.RequestHandler
) {
app.post('/api/sessions/:id/close', requireAuth, async (req, res) => {
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
      if (session.status !== 'open') {
        return { error: 'invalid_state' as const, status: session.status };
      }

      const closedAt = new Date();
      const retentionExpiresAt =
        session.retentionHours === 0
          ? closedAt
          : new Date(closedAt.getTime() + session.retentionHours * 60 * 60 * 1000);

      const [updated] = await tx
        .update(sessions)
        .set({
          status: 'closed',
          closedAt,
          retentionExpiresAt,
          updatedAt: closedAt,
        })
        .where(eq(sessions.id, sessionId))
        .returning();

      await appendLedgerLine(tx, {
        sessionId,
        lineType: 'session_closed',
        payload: {
          closedAt: closedAt.toISOString(),
          retentionExpiresAt: retentionExpiresAt.toISOString(),
        },
        actorKind: 'facilitator',
        actorRef: facilitatorId,
        source: 'application_server',
        initialVisibility: 'facilitator_only',
      });

      const roomExisted = teardownRoom(sessionId);

      await appendLedgerLine(tx, {
        sessionId,
        lineType: 'room_destroyed',
        payload: { roomExisted, destroyedAt: new Date().toISOString() },
        actorKind: 'system',
        source: 'application_server',
        initialVisibility: 'facilitator_only',
      });

      const [tip] = await tx
        .select({
          sequenceNumber: ledgerLines.sequenceNumber,
          lineHash: ledgerLines.lineHash,
        })
        .from(ledgerLines)
        .where(eq(ledgerLines.sessionId, sessionId))
        .orderBy(desc(ledgerLines.sequenceNumber))
        .limit(1);

      if (tip) {
        const rootDigest = computePayloadDigest({
          sessionId,
          lastSequenceNumber: tip.sequenceNumber,
          lastLineHash: tip.lineHash,
          reason: 'session_closed',
        });
        const signatureBuf = await kms.sign(
          process.env.LOCAL_DEV_SIGNING_KEY || 'local-dev-signing-key',
          Buffer.from(rootDigest, 'hex')
        );
        await tx.insert(ledgerRoots).values({
          sessionId,
          lastSequenceNumber: tip.sequenceNumber,
          lastLineHash: tip.lineHash,
          reason: 'session_closed',
          signatureAlgorithm: 'HMAC-SHA256-dev',
          keyReference: 'local-dev-signing',
          signature: signatureBuf.toString('hex'),
        });
      }

      return { session: updated };
    });

    if ('error' in result && result.error === 'not_found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    if ('error' in result && result.error === 'forbidden') {
      return res.status(403).json({ error: 'Not authorized for this session.' });
    }
    if ('error' in result && result.error === 'invalid_state') {
      return res.status(409).json({ error: `Session cannot be closed from status ${result.status}` });
    }
    res.status(200).json(result.session);
  } catch (error) {
    console.error('[API] Failed to close session', error);
    res.status(500).json({ error: 'Failed to close session' });
  }
});

/** Create party invite; return plaintext code once; store only inviteCodeHash. */
app.post('/api/sessions/:id/invites', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const { identityClass, displayLabel } = req.body;
  const facilitatorId = req.facilitatorId!;

  if (!identityClass || !IDENTITY_CLASSES.has(identityClass)) {
    return res.status(400).json({
      error: 'identityClass must be one of: named, role_only, affiliation_only, unnamed',
    });
  }
  if (!displayLabel || typeof displayLabel !== 'string') {
    return res.status(400).json({ error: 'displayLabel is required' });
  }

  try {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.facilitatorId !== facilitatorId) {
      return res.status(403).json({ error: 'Not authorized for this session.' });
    }
    if (session.status !== 'draft' && session.status !== 'open') {
      return res.status(409).json({ error: 'Invites only allowed for draft or open sessions' });
    }

    const { code, hash } = generateInviteCode();

    const created = await db.transaction(async (tx) => {
      const [newParty] = await tx
        .insert(parties)
        .values({
          sessionId,
          identityClass,
          displayLabel,
          inviteCodeHash: hash,
          inviteStatus: 'pending',
        })
        .returning();

      await appendLedgerLine(tx, {
        sessionId,
        lineType: 'invite_created',
        payload: {
          partyId: newParty.id,
          identityClass,
        },
        actorKind: 'facilitator',
        actorRef: facilitatorId,
        source: 'application_server',
        initialVisibility: 'facilitator_only',
      });

      return newParty;
    });

    res.status(201).json({
      party: {
        id: created.id,
        sessionId: created.sessionId,
        identityClass: created.identityClass,
        displayLabel: created.displayLabel,
        inviteStatus: created.inviteStatus,
      },
      inviteCode: code,
    });
  } catch (error) {
    console.error('[API] Failed to create invite', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

}
