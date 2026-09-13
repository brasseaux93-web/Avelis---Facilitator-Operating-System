import { afterEach, describe, expect, test } from 'vitest';
import { assertProductionKms, resetKmsForTests } from '../src/lib/kms';

describe('production KMS', () => {
  afterEach(() => {
    resetKmsForTests();
    delete process.env.NODE_ENV;
    delete process.env.KMS_PROVIDER;
    delete process.env.AWS_KMS_KEY_ID;
    delete process.env.AWS_KMS_SIGNING_KEY_ID;
  });

  test('local is fine outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.KMS_PROVIDER = 'local';
    expect(() => assertProductionKms()).not.toThrow();
  });

  test('production refuses the stub and missing key ids', () => {
    process.env.NODE_ENV = 'production';
    process.env.KMS_PROVIDER = 'local';
    expect(() => assertProductionKms()).toThrow(/aws/i);
    process.env.KMS_PROVIDER = 'aws';
    expect(() => assertProductionKms()).toThrow(/AWS_KMS_KEY_ID/);
    process.env.AWS_KMS_KEY_ID = 'arn:example';
    expect(() => assertProductionKms()).toThrow(/SIGNING/);
    process.env.AWS_KMS_SIGNING_KEY_ID = 'arn:sign';
    expect(() => assertProductionKms()).not.toThrow();
  });
});
