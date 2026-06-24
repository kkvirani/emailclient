import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "node:crypto";
import { encrypt, decrypt } from "./crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("crypto token vault (AES-256-GCM)", () => {
  it("round-trips plaintext", () => {
    const secret = "ya29.super-secret-refresh-token";
    const enc = encrypt(secret);
    expect(enc.ciphertext).not.toContain(secret);
    expect(decrypt(enc)).toBe(secret);
  });

  it("produces a unique IV each call", () => {
    const a = encrypt("same");
    const b = encrypt("same");
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("fails to decrypt tampered ciphertext (auth tag)", () => {
    const enc = encrypt("integrity-protected");
    const tampered = {
      ...enc,
      ciphertext: Buffer.from("0".repeat(enc.ciphertext.length)).toString(
        "base64"
      ),
    };
    expect(() => decrypt(tampered)).toThrow();
  });

  it("stamps the key version", () => {
    expect(encrypt("x").keyVersion).toBe(1);
  });
});
