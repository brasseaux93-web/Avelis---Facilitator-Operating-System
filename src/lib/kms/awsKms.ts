import type { EnvelopeKey, KmsProvider } from './types';

/**
 * AwsKmsProvider — production path stub.
 *
 * Documented AWS KMS APIs (wire with @aws-sdk/client-kms when credentials are available):
 * - GenerateDataKey: KeyId, KeySpec AES_256 → Plaintext + CiphertextBlob
 * - Decrypt: CiphertextBlob (+ optional KeyId) → Plaintext
 * - Sign: KeyId, Message (digest), MessageType DIGEST, SigningAlgorithm e.g. RSASSA_PSS_SHA_256
 * - Verify: KeyId, Message, Signature, MessageType DIGEST, SigningAlgorithm
 *
 * TODO: Wire AWS credentials via IAM role / env (AWS_REGION, AWS_ACCESS_KEY_ID, etc.).
 * Do not embed long-lived keys in source. Prefer task role on ECS/Fargate.
 */
export class AwsKmsProvider implements KmsProvider {
  readonly name = 'aws' as const;

  private keyIdEnv(): string {
    return process.env.AWS_KMS_KEY_ID || process.env.AWS_KMS_SIGNING_KEY_ID || '';
  }

  async generateDataKey(keyId: string): Promise<EnvelopeKey> {
    void keyId;
    // TODO: const client = new KMSClient({}); await client.send(new GenerateDataKeyCommand({ KeyId: keyId, KeySpec: 'AES_256' }))
    throw new Error(
      'AwsKmsProvider.generateDataKey: not wired. Install @aws-sdk/client-kms and configure AWS_KMS_KEY_ID + IAM. See docs/deployment.md.'
    );
  }

  async decryptDataKey(keyId: string, ciphertext: Buffer): Promise<Buffer> {
    void keyId;
    void ciphertext;
    // TODO: DecryptCommand({ CiphertextBlob: ciphertext, KeyId: keyId })
    throw new Error(
      'AwsKmsProvider.decryptDataKey: not wired. Install @aws-sdk/client-kms and configure credentials.'
    );
  }

  async sign(keyId: string, digest: Buffer): Promise<Buffer> {
    void digest;
    const id = keyId || this.keyIdEnv();
    if (!id) {
      throw new Error('AwsKmsProvider.sign: AWS_KMS_SIGNING_KEY_ID (or keyId) required');
    }
    // TODO: SignCommand({ KeyId: id, Message: digest, MessageType: 'DIGEST', SigningAlgorithm: 'RSASSA_PSS_SHA_256' })
    throw new Error(
      'AwsKmsProvider.sign: stub only. Wire KMS Sign API with @aws-sdk/client-kms before production use.'
    );
  }

  async verify(keyId: string, digest: Buffer, signature: Buffer): Promise<boolean> {
    void keyId;
    void digest;
    void signature;
    // TODO: VerifyCommand(...)
    throw new Error(
      'AwsKmsProvider.verify: stub only. Wire KMS Verify API with @aws-sdk/client-kms before production use.'
    );
  }
}
