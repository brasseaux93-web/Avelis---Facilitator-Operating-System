/**
 * Envelope crypto helpers + KMS factory re-exports.
 * Prefer getKms() for sign/verify/generateDataKey in server code.
 */
import crypto from 'node:crypto';
import { getKms, resetKmsForTests } from './kms/index';
import type { EnvelopeKey, KmsProvider } from './kms/types';

export type { EnvelopeKey, KmsProvider };
export { getKms, resetKmsForTests };

/**
 * @deprecated Prefer getKms() so provider selection (local|aws) is honored.
 * Kept for Phase 2 call sites during transition; delegates to getKms().
 */
export const kms = {
  generateDataKey: (keyId: string) => getKms().generateDataKey(keyId),
  decryptDataKey: (keyId: string, ciphertext: Buffer) => getKms().decryptDataKey(keyId, ciphertext),
  sign: (keyId: string, digest: Buffer) => getKms().sign(keyId, digest),
  verify: (keyId: string, digest: Buffer, signature: Buffer) =>
    getKms().verify(keyId, digest, signature),
};

/**
 * Encrypts data using AES-256-GCM.
 */
export function encrypt(
  plaintext: string,
  key: Buffer
): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { ciphertext, iv, authTag };
}

/**
 * Decrypts data using AES-256-GCM.
 */
export function decrypt(ciphertext: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}
