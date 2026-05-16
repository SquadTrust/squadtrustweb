// Key derivation from transaction_ref (shared secret between buyer and merchant)
export async function deriveE2EKey(transactionRef: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(transactionRef),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("squadtrust-e2e-v1"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface ChatPayload {
  t: string;   // text message
  v: boolean;  // is_voice
  d?: string;  // attachment data URL
  n?: string;  // attachment filename
}

export async function encryptPayload(payload: ChatPayload, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return "ENC:" + btoa(Array.from(combined, (b) => String.fromCharCode(b)).join(""));
}

export async function decryptPayload(encrypted: string, key: CryptoKey): Promise<ChatPayload> {
  if (!encrypted.startsWith("ENC:")) throw new Error("Not encrypted");
  const combined = Uint8Array.from(
    Array.from(atob(encrypted.slice(4)), (c) => c.charCodeAt(0))
  );
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext)) as ChatPayload;
}
