import { afterEach, describe, expect, test } from 'vitest';
import {
  decryptJson,
  encryptJson,
  isBodyEnvelope,
  resetKmsForTests,
} from '../src/lib/encryption';

describe('envelope encryption', () => {
  afterEach(() => {
    resetKmsForTests();
  });

  test('encryptJson is called and round-trips', async () => {
    process.env.KMS_PROVIDER = 'local';
    resetKmsForTests();
    const plain = { party_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' };
    const env = await encryptJson(plain);
    expect(isBodyEnvelope(env)).toBe(true);
    expect(JSON.stringify(env)).not.toContain('aaaaaaaa');
    await expect(decryptJson(env)).resolves.toEqual(plain);
  });

  test('plaintext legacy rows pass through', async () => {
    await expect(decryptJson({ party_id: 'x' })).resolves.toEqual({ party_id: 'x' });
  });
});
