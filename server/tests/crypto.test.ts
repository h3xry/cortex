import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/services/crypto.js";

describe("crypto", () => {
  it("hashPassword returns salt:hash format", async () => {
    const hash = await hashPassword("test1234");
    expect(hash).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
    const [salt, key] = hash.split(":");
    expect(salt.length).toBe(32); // 16 bytes hex
    expect(key.length).toBe(128); // 64 bytes hex
  });

  it("verifyPassword returns true for correct password", async () => {
    const hash = await hashPassword("mypassword");
    const result = await verifyPassword("mypassword", hash);
    expect(result).toBe(true);
  });

  it("verifyPassword returns false for wrong password", async () => {
    const hash = await hashPassword("mypassword");
    const result = await verifyPassword("wrong", hash);
    expect(result).toBe(false);
  });

  it("different calls produce different salts", async () => {
    const hash1 = await hashPassword("same");
    const hash2 = await hashPassword("same");
    expect(hash1).not.toBe(hash2);
    // But both verify correctly
    expect(await verifyPassword("same", hash1)).toBe(true);
    expect(await verifyPassword("same", hash2)).toBe(true);
  });

  it("verifyPassword returns false for malformed hash", async () => {
    expect(await verifyPassword("test", "nocolon")).toBe(false);
    expect(await verifyPassword("test", "")).toBe(false);
  });
});
