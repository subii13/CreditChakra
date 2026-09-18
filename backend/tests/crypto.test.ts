import { describe, expect, it, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("crypto (AES-256-GCM field encryption)", () => {
  it("round-trips plaintext through encrypt/decrypt", async () => {
    const { encryptField, decryptField } = await import("../src/lib/crypto");
    const plaintext = "contact: 9876543210";
    const encrypted = encryptField(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptField(encrypted)).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext each time (random IV)", async () => {
    const { encryptField } = await import("../src/lib/crypto");
    const a = encryptField("same input");
    const b = encryptField("same input");
    expect(a).not.toBe(b);
  });

  it("rejects a tampered ciphertext instead of silently returning wrong data", async () => {
    const { encryptField, decryptField } = await import("../src/lib/crypto");
    const encrypted = encryptField("sensitive value");
    const [iv, tag, ciphertext] = encrypted.split(":");
    const tampered = [iv, tag, Buffer.from("tampered-ciphertext").toString("base64")].join(":");
    expect(() => decryptField(tampered)).toThrow();
  });
});
