// Helper: Convert ArrayBuffer/Uint8Array to Base64URL string
function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper: Convert Base64URL string back to Uint8Array
function base64UrlToBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface EncryptedPayload {
  ciphertext: string; // Base64URL encoded
  iv: string;         // Base64URL encoded
  secretKeyHash: string; // Base64URL encoded AES key for URL fragment
}

/**
 * Encrypts raw text using AES-GCM-256.
 * Returns the ciphertext, IV, and the secret key to be appended to the URL fragment.
 */
export async function encryptText(plaintext: string): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const encodedText = enc.encode(plaintext);

  // 1. Generate a secure random 256-bit AES key
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Generate a secure random 96-bit Initialization Vector (IV)
  const iv = window.crypto.subtle.generateKey ? window.crypto.getRandomValues(new Uint8Array(12)) : new Uint8Array(12);
  // (Note: window.crypto.getRandomValues(new Uint8Array(12)) is the correct standard way for IVs)
  const ivBytes = window.crypto.getRandomValues(new Uint8Array(12));

  // 3. Encrypt the plaintext
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encodedText
  );

  // 4. Export the raw key so it can live exclusively in the URL fragment
  const rawKey = await window.crypto.subtle.exportKey("raw", key);

  return {
    ciphertext: bufferToBase64Url(encryptedBuffer),
    iv: bufferToBase64Url(ivBytes),
    secretKeyHash: bufferToBase64Url(rawKey),
  };
}

/**
 * Decrypts ciphertext using the secret key extracted from the URL fragment.
 */
export async function decryptText(ciphertextBase64: string, ivBase64: string, secretKeyBase64: string): Promise<string> {
  const cipherBytes = base64UrlToBuffer(ciphertextBase64);
  const ivBytes = base64UrlToBuffer(ivBase64);
  const keyBytes = base64UrlToBuffer(secretKeyBase64);

  // 1. Import the raw key back into the SubtleCrypto format
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // 2. Decrypt the ciphertext
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    cipherBytes
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}