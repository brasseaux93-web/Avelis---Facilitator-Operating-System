import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz';

/**
 * Generate a one-time invite code and its SHA-256 hex hash for storage.
 * Store only `hash`; return `code` to the caller once.
 */
export function generateInviteCode(): { code: string; hash: string } {
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  const hash = crypto.createHash('sha256').update(code, 'utf8').digest('hex');
  return { code, hash };
}

/** Timing-safe verification of invite code against stored SHA-256 hex hash. */
export function verifyInviteCode(code: string, hash: string): boolean {
  const digest = crypto.createHash('sha256').update(code, 'utf8').digest('hex');
  try {
    const a = Buffer.from(digest, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
