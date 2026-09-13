// src/lib/crypto.ts
// Secure AES-GCM in-memory encryption for Avelis Zero-Knowledge buffers

/**
 * Generates a volatile AES-GCM symmetric key for the session.
 * This key never touches disk, localStorage, or a database.
 */
export async function generateSessionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable (so we can export and send it via WebRTC to peers)
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports the CryptoKey to a raw ArrayBuffer so it can be transmitted over WebRTC.
 */
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await window.crypto.subtle.exportKey('raw', key);
}

/**
 * Imports a raw ArrayBuffer back into a CryptoKey.
 */
export async function importKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    {
      name: 'AES-GCM',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using the symmetric AES-GCM key.
 * Returns a combined ArrayBuffer containing the IV (12 bytes) and the ciphertext.
 */
export async function encryptMessage(key: CryptoKey, plaintext: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(plaintext);
  
  // AES-GCM requires a 12-byte initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedText
  );

  // Combine IV and Ciphertext into a single ArrayBuffer for transmission
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(new Uint8Array(iv), 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return combined.buffer;
}

/**
 * Decrypts a combined ArrayBuffer (IV + Ciphertext) back into plaintext.
 */
export async function decryptMessage(key: CryptoKey, combinedBuffer: ArrayBuffer): Promise<string> {
  const combined = new Uint8Array(combinedBuffer);
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
