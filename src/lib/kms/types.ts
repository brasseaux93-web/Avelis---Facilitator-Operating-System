/**
 * KMS provider interface — compatible with AWS KMS GenerateDataKey / Decrypt / Sign / Verify.
 * Never log plaintext keys, digests of speech, or ciphertext blobs that may wrap session content.
 */

export interface EnvelopeKey {
  plaintext: Buffer;
  /** Encrypted data key (KMS CiphertextBlob). */
  ciphertext: Buffer;
}

export interface KmsProvider {
  readonly name: 'local' | 'aws';

  /** KMS GenerateDataKey (or local equivalent). */
  generateDataKey(keyId: string): Promise<EnvelopeKey>;

  /** KMS Decrypt on a data-key CiphertextBlob. */
  decryptDataKey(keyId: string, ciphertext: Buffer): Promise<Buffer>;

  /** KMS Sign over a digest (MessageType DIGEST). */
  sign(keyId: string, digest: Buffer): Promise<Buffer>;

  /** KMS Verify (or local equivalent). */
  verify(keyId: string, digest: Buffer, signature: Buffer): Promise<boolean>;
}
