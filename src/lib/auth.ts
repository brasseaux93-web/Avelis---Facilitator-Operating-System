import crypto from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

export interface FacilitatorTokenPayload {
  sub: string;
  orgId: string;
  email: string;
  exp: number;
}

export interface PartyTokenPayload {
  sub: string;
  sessionId: string;
  partyId: string;
  exp: number;
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf.toString('base64url');
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }
  return secret;
}

function parseExpirySeconds(raw: string | undefined, fallbackSeconds: number): number {
  if (!raw) return fallbackSeconds;
  const m = /^(\d+)([smhd])?$/.exec(raw.trim());
  if (!m) return fallbackSeconds;
  const n = Number(m[1]);
  const unit = m[2] || 's';
  if (unit === 's') return n;
  if (unit === 'm') return n * 60;
  if (unit === 'h') return n * 3600;
  if (unit === 'd') return n * 86400;
  return fallbackSeconds;
}

function signHmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('base64url');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Argon2id password hash. */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

/** Verify password against Argon2id hash. */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Compact HMAC-SHA256 token: header.payload.sig (JWT-like).
 * Payload: { sub, orgId, email, exp }
 */
export function signFacilitatorToken(payload: Omit<FacilitatorTokenPayload, 'exp'> & { exp?: number }): string {
  const secret = jwtSecret();
  const exp =
    payload.exp ??
    Math.floor(Date.now() / 1000) + parseExpirySeconds(process.env.JWT_EXPIRY, 15 * 60);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body: FacilitatorTokenPayload = {
    sub: payload.sub,
    orgId: payload.orgId,
    email: payload.email,
    exp,
  };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(body));
  const sig = signHmac(`${h}.${p}`, secret);
  return `${h}.${p}.${sig}`;
}

export function verifyFacilitatorToken(token: string): FacilitatorTokenPayload | null {
  try {
    const secret = jwtSecret();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts as [string, string, string];
    const expected = signHmac(`${h}.${p}`, secret);
    if (!timingSafeEqualStr(sig, expected)) return null;
    const payload = JSON.parse(fromB64url(p).toString('utf8')) as FacilitatorTokenPayload;
    if (!payload?.sub || !payload?.orgId || !payload?.email || typeof payload.exp !== 'number') {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Party session token (in-memory client use only). */
export function signPartySessionToken(
  payload: Omit<PartyTokenPayload, 'exp'> & { exp?: number }
): string {
  const secret = jwtSecret();
  const exp = payload.exp ?? Math.floor(Date.now() / 1000) + 12 * 3600;
  const header = { alg: 'HS256', typ: 'PTY' };
  const body: PartyTokenPayload = {
    sub: payload.sub,
    sessionId: payload.sessionId,
    partyId: payload.partyId,
    exp,
  };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(body));
  const sig = signHmac(`${h}.${p}`, secret);
  return `${h}.${p}.${sig}`;
}

export function verifyPartySessionToken(token: string): PartyTokenPayload | null {
  try {
    const secret = jwtSecret();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts as [string, string, string];
    const expected = signHmac(`${h}.${p}`, secret);
    if (!timingSafeEqualStr(sig, expected)) return null;
    const payload = JSON.parse(fromB64url(p).toString('utf8')) as PartyTokenPayload;
    if (!payload?.sub || !payload?.sessionId || !payload?.partyId || typeof payload.exp !== 'number') {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Room token: HMAC-SHA256(sessionId:partyId, ROOM_SHARED_SECRET) hex — matches room server. */
export function createRoomToken(sessionId: string, partyId: string): string {
  const secret = process.env.ROOM_SHARED_SECRET;
  if (!secret) {
    throw new Error('ROOM_SHARED_SECRET is required');
  }
  return crypto.createHmac('sha256', secret).update(`${sessionId}:${partyId}`).digest('hex');
}

/** Mint a Supabase JWT for Realtime signaling */
export function signSupabaseRealtimeToken(sessionId: string, partyId: string, role: 'host' | 'guest'): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    // Return empty string if no secret is set, allowing fallback or error later
    console.error('SUPABASE_JWT_SECRET is required for WebRTC signaling');
    return '';
  }
  
  const payload = {
    role: 'authenticated', // Required for Supabase RLS policies
    session_id: sessionId,
    party_id: partyId,
    avelis_role: role,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600, // 12 hours
  };
  
  return jwt.sign(payload, secret);
}
