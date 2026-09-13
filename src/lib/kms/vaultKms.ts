/**
 * HashiCorp Vault Transit. No SDK — HTTP to VAULT_ADDR.
 * Production alternative to AWS KMS. Never logs tokens or plaintext.
 */
import type { EnvelopeKey, KmsProvider } from './types';

export class VaultKmsProvider implements KmsProvider {
  readonly name = 'vault' as const;

  private addr(): string {
    const a = process.env.VAULT_ADDR || '';
    if (!a) throw new Error('VaultKmsProvider: VAULT_ADDR is required');
    return a.replace(/\/$/, '');
  }

  private token(): string {
    const t = process.env.VAULT_TOKEN || '';
    if (!t) throw new Error('VaultKmsProvider: VAULT_TOKEN is required');
    return t;
  }

  private keyName(keyId?: string): string {
    const id = keyId || process.env.VAULT_TRANSIT_KEY || '';
    if (!id) throw new Error('VaultKmsProvider: VAULT_TRANSIT_KEY (or keyId) required');
    return id;
  }

  private async vault<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.addr()}/v1/${path}`, {
      method: 'POST',
      headers: {
        'X-Vault-Token': this.token(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`VaultKmsProvider: transit ${path} failed (${res.status})`);
    }
    return (await res.json()) as T;
  }

  async generateDataKey(keyId: string): Promise<EnvelopeKey> {
    const plaintext = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
    const out = await this.vault<{ data: { ciphertext: string } }>(
      `transit/encrypt/${this.keyName(keyId)}`,
      { plaintext: plaintext.toString('base64') }
    );
    return { plaintext, ciphertext: Buffer.from(out.data.ciphertext, 'utf8') };
  }

  async decryptDataKey(keyId: string, ciphertext: Buffer): Promise<Buffer> {
    const out = await this.vault<{ data: { plaintext: string } }>(
      `transit/decrypt/${this.keyName(keyId)}`,
      { ciphertext: ciphertext.toString('utf8') }
    );
    return Buffer.from(out.data.plaintext, 'base64');
  }

  async sign(keyId: string, digest: Buffer): Promise<Buffer> {
    const out = await this.vault<{ data: { signature: string } }>(
      `transit/sign/${this.keyName(keyId)}`,
      { input: digest.toString('base64'), hash_algorithm: 'sha2-256', prehashed: true }
    );
    return Buffer.from(out.data.signature, 'utf8');
  }

  async verify(keyId: string, digest: Buffer, signature: Buffer): Promise<boolean> {
    try {
      const out = await this.vault<{ data: { valid: boolean } }>(
        `transit/verify/${this.keyName(keyId)}`,
        {
          input: digest.toString('base64'),
          signature: signature.toString('utf8'),
          hash_algorithm: 'sha2-256',
          prehashed: true,
        }
      );
      return Boolean(out.data.valid);
    } catch {
      return false;
    }
  }
}
