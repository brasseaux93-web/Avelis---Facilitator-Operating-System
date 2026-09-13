import crypto from 'node:crypto';
import type { EnvelopeKey, KmsProvider } from './types';

/**
 * LocalDevKms — development / test only.
 * Uses LOCAL_DEV_ENCRYPTION_KEY and LOCAL_DEV_SIGNING_KEY.
 * Forbidden in production (getKms refuses when NODE_ENV=production and KMS_PROVIDER=local).
 */
export class LocalDevKms implements KmsProvider {
  readonly name = 'local' as const;

  private encryptionSecret(): Buffer {
    const raw = process.env.LOCAL_DEV_ENCRYPTION_KEY || 'local-dev-key-not-for-production-use';
    return crypto.createHash('sha256').update(raw, 'utf8').digest();
  }

  private signingSecret(): Buffer {
    const raw = process.env.LOCAL_DEV_SIGNING_KEY || 'local-dev-signing-key-not-for-production-use';
    return crypto.createHash('sha256').update(raw, 'utf8').digest();
  }

  async generateDataKey(_keyId: string): Promise<EnvelopeKey> {
    const plaintext = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionSecret(), iv);
    const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([Buffer.from('local1'), iv, tag, enc]);
    return { plaintext, ciphertext };
  }

  async decryptDataKey(_keyId: string, ciphertext: Buffer): Promise<Buffer> {
    if (!ciphertext.subarray(0, 6).equals(Buffer.from('local1'))) {
      throw new Error('LocalDevKms: invalid ciphertext prefix');
    }
    const iv = ciphertext.subarray(6, 18);
    const tag = ciphertext.subarray(18, 34);
    const enc = ciphertext.subarray(34);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionSecret(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]);
  }

  async sign(_keyId: string, digest: Buffer): Promise<Buffer> {
    return crypto.createHmac('sha256', this.signingSecret()).update(digest).digest();
  }

  async verify(_keyId: string, digest: Buffer, signature: Buffer): Promise<boolean> {
    const expected = await this.sign(_keyId, digest);
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(expected, signature);
  }
}
