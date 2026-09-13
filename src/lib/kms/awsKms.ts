import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
  SignCommand,
  VerifyCommand,
} from '@aws-sdk/client-kms';
import type { EnvelopeKey, KmsProvider } from './types';

/**
 * AwsKmsProvider — production path using @aws-sdk/client-kms when AWS_KMS_KEY_ID is set.
 * Credentials: IAM task role / env (AWS_REGION, default credential chain). Never embed long-lived keys.
 */
export class AwsKmsProvider implements KmsProvider {
  readonly name = 'aws' as const;
  private client: KMSClient;

  constructor(client?: KMSClient) {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    this.client = client ?? new KMSClient({ region });
  }

  private requireKeyId(keyId?: string): string {
    const id = keyId || process.env.AWS_KMS_KEY_ID || process.env.AWS_KMS_SIGNING_KEY_ID || '';
    if (!id) {
      throw new Error('AwsKmsProvider: AWS_KMS_KEY_ID (or keyId argument) required');
    }
    return id;
  }

  async generateDataKey(keyId: string): Promise<EnvelopeKey> {
    const id = this.requireKeyId(keyId);
    const out = await this.client.send(
      new GenerateDataKeyCommand({ KeyId: id, KeySpec: 'AES_256' })
    );
    if (!out.Plaintext || !out.CiphertextBlob) {
      throw new Error('AwsKmsProvider.generateDataKey: empty KMS response');
    }
    return {
      plaintext: Buffer.from(out.Plaintext),
      ciphertext: Buffer.from(out.CiphertextBlob),
    };
  }

  async decryptDataKey(keyId: string, ciphertext: Buffer): Promise<Buffer> {
    const id = this.requireKeyId(keyId);
    const out = await this.client.send(
      new DecryptCommand({ CiphertextBlob: ciphertext, KeyId: id })
    );
    if (!out.Plaintext) {
      throw new Error('AwsKmsProvider.decryptDataKey: empty plaintext');
    }
    return Buffer.from(out.Plaintext);
  }

  async sign(keyId: string, digest: Buffer): Promise<Buffer> {
    const id =
      keyId || process.env.AWS_KMS_SIGNING_KEY_ID || process.env.AWS_KMS_KEY_ID || '';
    if (!id) {
      throw new Error('AwsKmsProvider.sign: AWS_KMS_SIGNING_KEY_ID (or keyId) required');
    }
    const out = await this.client.send(
      new SignCommand({
        KeyId: id,
        Message: digest,
        MessageType: 'DIGEST',
        SigningAlgorithm: 'RSASSA_PSS_SHA_256',
      })
    );
    if (!out.Signature) {
      throw new Error('AwsKmsProvider.sign: empty signature');
    }
    return Buffer.from(out.Signature);
  }

  async verify(keyId: string, digest: Buffer, signature: Buffer): Promise<boolean> {
    const id =
      keyId || process.env.AWS_KMS_SIGNING_KEY_ID || process.env.AWS_KMS_KEY_ID || '';
    if (!id) {
      throw new Error('AwsKmsProvider.verify: AWS_KMS_SIGNING_KEY_ID (or keyId) required');
    }
    const out = await this.client.send(
      new VerifyCommand({
        KeyId: id,
        Message: digest,
        MessageType: 'DIGEST',
        Signature: signature,
        SigningAlgorithm: 'RSASSA_PSS_SHA_256',
      })
    );
    return Boolean(out.SignatureValid);
  }
}
