import express from 'express';
import { verifyFacilitatorToken } from '../lib/auth';

export const IDENTITY_CLASSES = new Set(['named', 'role_only', 'affiliation_only', 'unnamed']);

declare global {
  namespace Express {
    interface Request {
      facilitatorId?: string;
      organizationId?: string;
      facilitatorEmail?: string;
    }
  }
}

/** Invite redeem failure rate limit: max 5 failures / 15 min per IP (in memory). */
const inviteFailures = new Map<string, { count: number; resetAt: number }>();
const INVITE_FAIL_MAX = 5;
const INVITE_FAIL_WINDOW_MS = 15 * 60 * 1000;

export function clientIp(req: express.Request): string {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0]!.trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function inviteRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = inviteFailures.get(ip);
  if (!entry) return false;
  if (now > entry.resetAt) {
    inviteFailures.delete(ip);
    return false;
  }
  return entry.count >= INVITE_FAIL_MAX;
}

export function recordInviteFailure(ip: string): void {
  const now = Date.now();
  const entry = inviteFailures.get(ip);
  if (!entry || now > entry.resetAt) {
    inviteFailures.set(ip, { count: 1, resetAt: now + INVITE_FAIL_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

/**
 * Bearer JWT verification. Attaches facilitatorId + organizationId from token.
 */
export const requireAuth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign in did not complete.' });
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyFacilitatorToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Sign in did not complete.' });
  }
  req.facilitatorId = payload.sub;
  req.organizationId = payload.orgId;
  req.facilitatorEmail = payload.email;
  next();
};
