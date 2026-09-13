import { afterEach, describe, expect, test } from 'vitest';
import { assertProductionKms, resetKmsForTests, securityHealthSnapshot } from '../src/lib/kms';

describe('production KMS', () => {
  afterEach(() => {
    resetKmsForTests();
    delete process.env.NODE_ENV;
    delete process.env.KMS_PROVIDER;
    delete process.env.AWS_KMS_KEY_ID;
    delete process.env.AWS_KMS_SIGNING_KEY_ID;
    delete process.env.VAULT_ADDR;
    delete process.env.VAULT_TOKEN;
    delete process.env.VAULT_TRANSIT_KEY;
    delete process.env.LOCAL_DEV_ENCRYPTION_KEY;
    delete process.env.JWT_SECRET;
    delete process.env.ROOM_SHARED_SECRET;
  });

  test('local is fine outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.KMS_PROVIDER = 'local';
    expect(() => assertProductionKms()).not.toThrow();
  });

  test('production refuses the stub, mock secrets, and missing cloud ids', () => {
    process.env.NODE_ENV = 'production';
    process.env.KMS_PROVIDER = 'local';
    expect(() => assertProductionKms()).toThrow(/aws or vault|forbidden/i);
    process.env.KMS_PROVIDER = 'aws';
    process.env.LOCAL_DEV_ENCRYPTION_KEY = 'local-dev-key-not-for-production-use';
    expect(() => assertProductionKms()).toThrow(/insecure/i);
    delete process.env.LOCAL_DEV_ENCRYPTION_KEY;
    expect(() => assertProductionKms()).toThrow(/AWS_KMS_KEY_ID/);
    process.env.AWS_KMS_KEY_ID = 'arn:example';
    expect(() => assertProductionKms()).toThrow(/SIGNING/);
    process.env.AWS_KMS_SIGNING_KEY_ID = 'arn:sign';
    expect(() => assertProductionKms()).not.toThrow();
  });

  test('production accepts vault when addr, token, and transit key are set', () => {
    process.env.NODE_ENV = 'production';
    process.env.KMS_PROVIDER = 'vault';
    expect(() => assertProductionKms()).toThrow(/VAULT_ADDR/);
    process.env.VAULT_ADDR = 'https://vault.example';
    process.env.VAULT_TOKEN = 's.test';
    process.env.VAULT_TRANSIT_KEY = 'avelis';
    expect(() => assertProductionKms()).not.toThrow();
  });

  test('security health never includes secret values', () => {
    process.env.KMS_PROVIDER = 'local';
    process.env.GROQ_API_KEY = 'gsk_test_should_not_leak';
    const snap = securityHealthSnapshot();
    const encoded = JSON.stringify(snap);
    expect(encoded).not.toContain('gsk_');
    expect(snap.room.persistedSpeech).toBe(false);
    expect(snap.subprocessors.speechStored).toBe(false);
  });
});
