// src/lib/crypto.ts

/**
 * Utility functions for zero-knowledge AES-256-GCM encryption and decryption
 * utilizing native Web Crypto API (crypto.subtle).
 */

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function generateKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
}

export async function importKey(keyData: Uint8Array): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'raw',
    keyData as BufferSource,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt function taking a single text argument
export async function encryptText(text: string): Promise<{
  ciphertext: string;
  iv: string;
  secretKeyHash: string;
}> {
  const key = await generateKey();
  const exportedKey = await exportKey(key);
  const secretKeyHash = bufferToBase64(exportedKey);

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    data as BufferSource
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    secretKeyHash,
  };
}

// Decrypt function taking raw Base64 string parameters
export async function decryptText(
  ciphertextBase64: string,
  ivBase64: string,
  secretKeyHashBase64: string
): Promise<string> {
  const keyBuffer = base64ToBuffer(secretKeyHashBase64);
  const key = await importKey(keyBuffer);

  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Legacy aliases for backward compatibility
export { encryptText as encryptData, decryptText as decryptData };