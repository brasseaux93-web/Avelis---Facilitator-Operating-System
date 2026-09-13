/**
 * KMS provider interface — AWS KMS, HashiCorp Vault Transit, or local-dev.
 * Never log plaintext keys, speech, or ciphertext that may wrap session content.
 */

export type KmsProviderName = 'local' | 'aws' | 'vault';

export interface EnvelopeKey {
  plaintext: Buffer;
  ciphertext: Buffer;
}

export interface KmsProvider {
  readonly name: KmsProviderName;
  generateDataKey(keyId: string): Promise<EnvelopeKey>;
  decryptDataKey(keyId: string, ciphertext: Buffer): Promise<Buffer>;
  sign(keyId: string, digest: Buffer): Promise<Buffer>;
  verify(keyId: string, digest: Buffer, signature: Buffer): Promise<boolean>;
}
