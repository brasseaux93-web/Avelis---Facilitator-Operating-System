import type { KmsProvider } from './types';
import { LocalDevKms } from './localDevKms';
import { AwsKmsProvider } from './awsKms';

export type { EnvelopeKey, KmsProvider } from './types';
export { LocalDevKms } from './localDevKms';
export { AwsKmsProvider } from './awsKms';

let cached: KmsProvider | null = null;

/**
 * Factory: KMS_PROVIDER=local|aws (default local outside production).
 * Production refuses local provider.
 */
export function getKms(): KmsProvider {
  if (cached) return cached;

  const provider = (process.env.KMS_PROVIDER || 'local').toLowerCase();
  const isProd = process.env.NODE_ENV === 'production';

  if (provider === 'aws') {
    cached = new AwsKmsProvider();
    return cached;
  }

  if (provider === 'local') {
    if (isProd) {
      throw new Error(
        'KMS_PROVIDER=local is forbidden when NODE_ENV=production. Set KMS_PROVIDER=aws and AWS KMS key IDs.'
      );
    }
    cached = new LocalDevKms();
    return cached;
  }

  throw new Error(`Unknown KMS_PROVIDER=${provider}. Use local or aws.`);
}

/** Test helper — clear singleton between Vitest cases. */
export function resetKmsForTests(): void {
  cached = null;
}

/**
 * Production refuses the local stub. Requires AWS key ids before boot.
 * Does not mint keys — that is your AWS account.
 */
export function assertProductionKms(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const provider = (process.env.KMS_PROVIDER || '').toLowerCase();
  if (provider !== 'aws') {
    throw new Error('Production requires KMS_PROVIDER=aws. The local stub is forbidden.');
  }
  if (!process.env.AWS_KMS_KEY_ID) {
    throw new Error('Production requires AWS_KMS_KEY_ID.');
  }
  if (!process.env.AWS_KMS_SIGNING_KEY_ID) {
    throw new Error('Production requires AWS_KMS_SIGNING_KEY_ID.');
  }
}
