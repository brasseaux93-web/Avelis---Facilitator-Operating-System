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
  organizationKeyIds,
  isPublicRegisterEnabled,
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

  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many sign-in attempts. Try again later.' },
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
      res.status(200).json({ success: true, message: 'Request received' });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/auth/register-status', (_req, res) => {
    res.status(200).json({ publicRegister: isPublicRegisterEnabled() });
  });

  /** POST /api/auth/login — no password logging. */
  app.post('/api/auth/login', authRateLimiter, async (req, res) => {
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

      res.status(200).json({
        token,
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

  /**
   * POST /api/auth/register — facilitator organization setup.
   * Disabled in production unless ENABLE_PUBLIC_REGISTER=true.
   */
  app.post('/api/auth/register', authRateLimiter, async (req, res) => {
    if (!isPublicRegisterEnabled()) {
      return res.status(403).json({
        error: 'Facilitator accounts are provisioned after institutional evaluation.',
      });
    }

    const { email, password, displayName, organizationName, region } = req.body || {};
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'email, password, and displayName are required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    try {
      const keys = organizationKeyIds();
      const passwordHash = await hashPassword(password);
      const created = await db.transaction(async (tx) => {
        const [org] = await tx
          .insert(organizations)
          .values({
            name: organizationName || 'New Organization',
            region: region || 'local',
            encryptionKeyId: keys.encryptionKeyId,
            signingKeyId: keys.signingKeyId,
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

      res.status(201).json({
        token,
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

      const matched = candidates.find(
        (p) => p.inviteCodeHash && verifyInviteCode(code, p.inviteCodeHash)
      );

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
            // Session-scoped delivery address is no longer needed after join.
            deliveryAddress: null,
          })
          .where(eq(parties.id, matched.id))
          .returning();

        await appendLedgerLine(tx, {
          sessionId: matched.sessionId,
          lineType: 'party_joined',
          payload: { partyId: matched.id, identityClass: nextIdentity },
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

      res.status(200).json({
        partySessionToken,
        sessionId: updated.sessionId,
        partyId: updated.id,
        roomToken,
        identityClass: updated.identityClass,
        displayLabel: updated.displayLabel,
      });
    } catch (error) {
      console.error('[API] Invite redeem failed', error);
      res.status(500).json({ error: 'Could not complete invite redeem.' });
    }
  });
}
