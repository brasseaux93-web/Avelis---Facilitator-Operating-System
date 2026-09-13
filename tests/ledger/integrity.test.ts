import { expect, test, describe } from 'vitest';
import { canonicalize, computePayloadDigest, computeLineHash } from '../../src/lib/ledger';

describe('Ledger Integrity', () => {
  test('canonicalize sorts keys and produces deterministic output', () => {
    const payload1 = { b: 2, a: 1 };
    const payload2 = { a: 1, b: 2 };
    
    expect(canonicalize(payload1)).toBe(canonicalize(payload2));
    expect(canonicalize(payload1)).toBe('{"a":1,"b":2}');
  });

  test('canonicalize handles nested objects', () => {
    const payload = { 
      user: { id: "123", name: "Alice" }, 
      action: "join" 
    };
    expect(canonicalize(payload)).toBe('{"action":"join","user":{"id":"123","name":"Alice"}}');
  });

  test('computePayloadDigest produces consistent SHA-256 hex', () => {
    const payload = { a: 1 };
    // SHA-256 of '{"a":1}'
    const digest = computePayloadDigest(payload);
    expect(digest).toHaveLength(64);
  });

  test('computeLineHash incorporates previous hash correctly', () => {
    const sessionId = "session-1";
    const seq = 1;
    const type = "session_opened";
    const payloadDigest = computePayloadDigest({});
    
    const hash1 = computeLineHash(sessionId, seq, type, payloadDigest, null);
    const hash2 = computeLineHash(sessionId, seq, type, payloadDigest, "genesis");
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    
    const hash3 = computeLineHash(sessionId, seq, type, payloadDigest, "some-prior-hash");
    expect(hash3).not.toBe(hash1);
  });
});
