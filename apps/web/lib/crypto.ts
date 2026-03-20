import { base64UrlToBytes, bytesToBase64Url } from './base64url';

export type EncryptedPayload = {
  alg: 'AES-GCM';
  iv: string;
  ciphertext: string;
  version: 1;
};

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function importAesKey(rawKey: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', toArrayBuffer(rawKey), { name: 'AES-GCM' }, false, usage);
}

export async function encryptMessage(plaintext: string): Promise<{ key: string; payload: string }> {
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importAesKey(rawKey, ['encrypt']);
  const data = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, data);

  const payload: EncryptedPayload = {
    alg: 'AES-GCM',
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
    version: 1,
  };

  return {
    key: bytesToBase64Url(rawKey),
    payload: JSON.stringify(payload),
  };
}

export async function decryptMessage(payload: string, fragmentKey: string): Promise<string> {
  const parsed = JSON.parse(payload) as EncryptedPayload;

  if (parsed.alg !== 'AES-GCM' || parsed.version !== 1) {
    throw new Error('Unsupported payload format.');
  }

  const rawKey = base64UrlToBytes(fragmentKey);
  const iv = base64UrlToBytes(parsed.iv);
  const ciphertext = base64UrlToBytes(parsed.ciphertext);
  const key = await importAesKey(rawKey, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext));

  return new TextDecoder().decode(plaintext);
}
