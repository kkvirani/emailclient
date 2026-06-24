import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

/**
 * AES-256-GCM token vault.
 * See docs/02-SYSTEM-ARCHITECTURE.md (Security boundaries).
 *
 * ENCRYPTION_KEY must be a base64-encoded 32-byte key. Generate with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Secrets are only ever decrypted server-side, in memory, when contacting a
 * provider. Plaintext is never persisted and never sent to the client.
 */

const ALGO = "aes-256-gcm";
const KEY_VERSION = 1;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY is not set. See .env.example for how to generate one."
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}).`
    );
  }
  return key;
}

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
  keyVersion: number;
}

export function encrypt(plaintext: string): EncryptedPayload {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit nonce recommended for GCM
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    keyVersion: KEY_VERSION,
  };
}

export function decrypt(payload: EncryptedPayload): string {
  const key = getKey();
  const decipher = createDecipheriv(
    ALGO,
    key,
    Buffer.from(payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
