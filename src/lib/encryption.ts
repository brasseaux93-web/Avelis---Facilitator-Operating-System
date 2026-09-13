// This is a minimal KMS abstraction compatible with AWS KMS.
import crypto from 'node:crypto';

export interface EnvelopeKey {
  plaintext: Buffer;
  ciphertext: Buffer; // This would typically be a string returned by KMS, but Buffer is used here for simplicity.
}

export class KmsProvider {
  /**
   * Generates a new data key.
   * In a real implementation, this calls KMS.GenerateDataKey.
   * Here we simulate it with random bytes and a dummy encryption.
   */
  async generateDataKey(keyId: string): Promise<EnvelopeKey> {
    const plaintext = crypto.randomBytes(32);
    // Dummy "encryption" for local dev
    const ciphertext = Buffer.from('encrypted_' + plaintext.toString('hex'));
    return { plaintext, ciphertext };
  }

  /**
   * Decrypts a data key.
   * In a real implementation, this calls KMS.Decrypt.
   */
  async decryptDataKey(keyId: string, ciphertext: Buffer): Promise<Buffer> {
    // Dummy "decryption" for local dev
    const prefix = 'encrypted_';
    const str = ciphertext.toString('utf8');
    if (str.startsWith(prefix)) {
      return Buffer.from(str.slice(prefix.length), 'hex');
    }
    throw new Error('Invalid ciphertext');
  }

  /**
   * Signs a payload using an asymmetric key.
   * In a real implementation, this calls KMS.Sign.
   */
  async sign(keyId: string, digest: Buffer): Promise<Buffer> {
    // For MVP/local, we use a local HMAC or ECDSA.
    // We'll mock a simple signature for now.
    return Buffer.from('mock_signature_' + digest.toString('hex'));
  }

  /**
   * Verifies a signature.
   */
  async verify(keyId: string, digest: Buffer, signature: Buffer): Promise<boolean> {
    const expected = Buffer.from('mock_signature_' + digest.toString('hex'));
    return signature.equals(expected);
  }
}

export const kms = new KmsProvider();

/**
 * Encrypts data using AES-256-GCM.
 */
export function encrypt(plaintext: string, key: Buffer): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
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
