import { describe, it, expect } from "vitest";
import { addToken, isValidToken, removeToken, isUnlockedHeader } from "../src/services/unlock-store.js";

describe("unlock-store", () => {
  it("addToken returns a UUID string", () => {
    const token = addToken();
    expect(typeof token).toBe("string");
    expect(token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("isValidToken returns true for added token", () => {
    const token = addToken();
    expect(isValidToken(token)).toBe(true);
  });

  it("isValidToken returns false for unknown token", () => {
    expect(isValidToken("not-a-real-token")).toBe(false);
  });

  it("removeToken invalidates a token", () => {
    const token = addToken();
    expect(isValidToken(token)).toBe(true);
    removeToken(token);
    expect(isValidToken(token)).toBe(false);
  });

  it("removeToken is safe for unknown token", () => {
    expect(() => removeToken("nonexistent")).not.toThrow();
  });

  it("isUnlockedHeader returns true with valid token header", () => {
    const token = addToken();
    expect(isUnlockedHeader({ "x-unlock-token": token })).toBe(true);
  });

  it("isUnlockedHeader returns false without header", () => {
    expect(isUnlockedHeader({})).toBe(false);
  });

  it("isUnlockedHeader returns false with invalid token", () => {
    expect(isUnlockedHeader({ "x-unlock-token": "bad" })).toBe(false);
  });

  it("isUnlockedHeader returns false with non-string header", () => {
    expect(isUnlockedHeader({ "x-unlock-token": undefined })).toBe(false);
  });
});
