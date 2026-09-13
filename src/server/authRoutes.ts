import express from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index';
import { parties, sessions, facilitatorAccounts, organizations } from '../db/schema';
import { appendLedgerLine } from '../lib/ledgerAppend';
import { verifyInviteCode } from '../lib/invite';
import {
  hashPassword,
  verifyPassword,
  signFacilitatorToken,
  signPartySessionToken,
  createRoomToken,
  signSupabaseRealtimeToken,
} from '../lib/auth';
import {
  IDENTITY_CLASSES,
  clientIp,
  inviteRateLimited,
  recordInviteFailure,
} from './middleware';

export function registerAuthRoutes(app: express.Express) {
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

  /** POST /api/auth/login — no password logging. */
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Sign in did not complete.' });
    }

    try {
      const [account] = await db
        .select()
        .from(facilitatorAccounts)
        .where(eq(facilitatorAccounts.email, email))
        .limit(1);

      if (!account || account.status !== 'active') {
        return res.status(401).json({ error: 'Sign in did not complete.' });
      }

      const ok = await verifyPassword(account.passwordHash, password);
      if (!ok) {
        return res.status(401).json({ error: 'Sign in did not complete.' });
      }

      const token = signFacilitatorToken({
        sub: account.id,
        orgId: account.organizationId,
        email: account.email,
      });

      // We only mint a supabase token when a session starts or they join a room, but they can get a generic one here or per-session.
      // Wait, in Avelis, Facilitators load the session and THEN connect. We can just mint a host token here that doesn't bind to a specific session, or they mint it later.
      // Actually, Supabase Realtime channel access can just check the role if we bind it. But for ease, let's let them have a generic token.
      const supabaseToken = signSupabaseRealtimeToken('any', account.id, 'host');

      res.status(200).json({
        token,
        supabaseToken,
        facilitator: {
          id: account.id,
          email: account.email,
          displayName: account.displayName,
          organizationId: account.organizationId,
        },
      });
    } catch (error) {
      console.error('[API] Login failed', error);
      res.status(500).json({ error: 'Sign in did not complete.' });
    }
  });

  /** POST /api/auth/register — Public sign up. */
  app.post('/api/auth/register', async (req, res) => {

    const { email, password, displayName, organizationName, region } = req.body || {};
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'email, password, and displayName are required' });
    }

    try {
      const passwordHash = await hashPassword(password);
      const created = await db.transaction(async (tx) => {
        const [org] = await tx
          .insert(organizations)
          .values({
            name: organizationName || 'New Organization',
            region: region || 'local',
            encryptionKeyId: 'local-dev-encryption',
            signingKeyId: 'local-dev-signing',
          })
          .returning();

        const [facilitator] = await tx
          .insert(facilitatorAccounts)
          .values({
            organizationId: org.id,
            email,
            displayName,
            passwordHash,
            status: 'active',
          })
          .returning();

        return { org, facilitator };
      });

      const token = signFacilitatorToken({
        sub: created.facilitator.id,
        orgId: created.org.id,
        email: created.facilitator.email,
      });

      const supabaseToken = signSupabaseRealtimeToken('any', created.facilitator.id, 'host');

      res.status(201).json({
        token,
        supabaseToken,
        facilitator: {
          id: created.facilitator.id,
          email: created.facilitator.email,
          displayName: created.facilitator.displayName,
          organizationId: created.org.id,
        },
      });
    } catch (error) {
      console.error('[API] Register failed', error);
      res.status(500).json({ error: 'Could not complete registration.' });
    }
  });

  /** Redeem invite code — rate-limited on failures. Never log codes. */
  app.post('/api/invites/redeem', async (req, res) => {
    const ip = clientIp(req);
    if (inviteRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many invite attempts. Try again later.' });
    }

    const { code, identityClass, displayLabel } = req.body || {};
    if (!code || typeof code !== 'string') {
      recordInviteFailure(ip);
      return res.status(400).json({ error: 'Could not complete invite redeem.' });
    }

    try {
      const codeHash = crypto.createHash('sha256').update(code, 'utf8').digest('hex');
      const candidates = await db
        .select()
        .from(parties)
        .where(and(eq(parties.inviteCodeHash, codeHash), eq(parties.inviteStatus, 'pending')));

      let matched = candidates.find((p) => p.inviteCodeHash && verifyInviteCode(code, p.inviteCodeHash));
      if (!matched) {
        const pending = await db
          .select()
          .from(parties)
          .where(eq(parties.inviteStatus, 'pending'))
          .limit(200);
        matched = pending.find((p) => p.inviteCodeHash && verifyInviteCode(code, p.inviteCodeHash));
      }

      if (!matched) {
        recordInviteFailure(ip);
        return res.status(401).json({ error: 'Could not complete invite redeem.' });
      }

      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, matched.sessionId))
        .limit(1);

      if (!session || (session.status !== 'draft' && session.status !== 'open')) {
        recordInviteFailure(ip);
        return res.status(409).json({ error: 'Session is not available to join.' });
      }

      const nextIdentity =
        identityClass && IDENTITY_CLASSES.has(identityClass)
          ? identityClass
          : matched.identityClass;
      const nextLabel =
        typeof displayLabel === 'string' && displayLabel.trim()
          ? displayLabel.trim()
          : matched.displayLabel;

      const joinedAt = new Date();
      const updated = await db.transaction(async (tx) => {
        const [party] = await tx
          .update(parties)
          .set({
            inviteStatus: 'joined',
            joinedAt,
            identityClass: nextIdentity as typeof matched.identityClass,
            displayLabel: nextLabel,
            inviteCodeHash: null,
          })
          .where(eq(parties.id, matched.id))
          .returning();

        await appendLedgerLine(tx, {
          sessionId: matched.sessionId,
          lineType: 'party_joined',
          payload: { partyId: matched.id },
          actorKind: 'party',
          actorRef: matched.id,
          source: 'party_ui',
          initialVisibility: 'facilitator_only',
        });

        await appendLedgerLine(tx, {
          sessionId: matched.sessionId,
          lineType: 'identity_class_set',
          payload: { partyId: matched.id, identityClass: nextIdentity },
          actorKind: 'party',
          actorRef: matched.id,
          source: 'party_ui',
          initialVisibility: 'facilitator_only',
        });

        return party;
      });

      const partySessionToken = signPartySessionToken({
        sub: updated.id,
        sessionId: updated.sessionId,
        partyId: updated.id,
      });
      const roomToken = createRoomToken(updated.sessionId, updated.id);
      const supabaseToken = signSupabaseRealtimeToken(updated.sessionId, updated.id, 'guest');

      res.status(200).json({
        partySessionToken,
        sessionId: updated.sessionId,
        partyId: updated.id,
        roomToken,
        supabaseToken,
        identityClass: updated.identityClass,
        displayLabel: updated.displayLabel,
      });
    } catch (error) {
      console.error('[API] Invite redeem failed', error);
      res.status(500).json({ error: 'Could not complete invite redeem.' });
    }
  });
}
