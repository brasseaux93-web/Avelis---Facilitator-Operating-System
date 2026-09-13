import express from 'express';
import rateLimit from 'express-rate-limit';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { sessions, parties } from '../db/schema';
import { appendLedgerLine } from '../lib/ledgerAppend';
import { generateInviteCode } from '../lib/invite';
import { teardownRoom } from '../room/memory';

const app = express();
app.use(express.json());
const PORT = Number(process.env.API_PORT || process.env.PORT || 3001);

const MOCK_FACILITATOR_ID = '00000000-0000-4000-8000-000000000001';
const MOCK_ORG_ID = '00000000-0000-4000-8000-000000000002';

const IDENTITY_CLASSES = new Set(['named', 'role_only', 'affiliation_only', 'unnamed']);

/**
 * TODO(Phase 2): Replace with real facilitator JWT verification.
 * This mock is intentionally insecure scaffolding — do NOT treat as production auth.
 * In production NODE_ENV, require AUTHORIZATION_BYPASS=true explicitly (local only).
 */
const requireAuth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const bypass = process.env.AUTHORIZATION_BYPASS === 'true';
  const isDev = process.env.NODE_ENV !== 'production';
  if (!bypass && !isDev) {
    return res.status(401).json({
      error: 'Unauthorized — Phase 2 JWT required (or AUTHORIZATION_BYPASS=true for local scaffolding)',
    });
  }
  // Mock identity headers for scaffolding only.
  req.headers['x-facilitator-id'] =
    (req.headers['x-facilitator-id'] as string) || MOCK_FACILITATOR_ID;
  req.headers['x-organization-id'] =
    (req.headers['x-organization-id'] as string) || MOCK_ORG_ID;
  next();
};

const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/contact', contactRateLimiter, async (req, res) => {
  const { email, useCase, bot_field } = req.body;

  if (bot_field) {
    return res.status(200).json({ success: true, message: 'Request received' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // Do not log message bodies from sessions; contact email is marketing-only.
    console.log(
      `[Contact API] Access request received (email domain: ${String(email).split('@')[1] ?? '?'})`
    );
    void useCase;
    await new Promise((resolve) => setTimeout(resolve, 800));
    res.status(200).json({ success: true, message: 'Request received' });
  } catch (error) {
    console.error('[Contact API] Failed to process request', error);
    res.status(500).json({ error: 'Internal server error' });
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

  const facilitatorId = req.headers['x-facilitator-id'] as string;
  const organizationId = req.headers['x-organization-id'] as string;

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

/** Open session: status open, openedAt now; append session_opened + retention_window_set. retentionHours immutable thereafter. */
app.post('/api/sessions/:id/open', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const facilitatorId = req.headers['x-facilitator-id'] as string;

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
        payload: { openedAt: openedAt.toISOString() },
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
    if ('error' in result && result.error === 'invalid_state') {
      return res.status(409).json({ error: `Session cannot be opened from status ${result.status}` });
    }
    res.status(200).json(result.session);
  } catch (error) {
    console.error('[API] Failed to open session', error);
    res.status(500).json({ error: 'Failed to open session' });
  }
});

/** Close session: set closed + retentionExpiresAt; teardown room; append session_closed + room_destroyed. */
app.post('/api/sessions/:id/close', requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const facilitatorId = req.headers['x-facilitator-id'] as string;

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

      return { session: updated };
    });

    if ('error' in result && result.error === 'not_found') {
      return res.status(404).json({ error: 'Session not found' });
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
  const facilitatorId = req.headers['x-facilitator-id'] as string;

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

    // Return code once — never persist plaintext.
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

  const facilitatorId = req.headers['x-facilitator-id'] as string;

  try {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
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

if (process.env.VITEST !== 'true') {
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

export { app };
