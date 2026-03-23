import { describe, it, expect } from "vitest";
import { ALLOWED_ORIGINS, PORT } from "../src/config.js";

describe("config", () => {
  it("should have default ALLOWED_ORIGINS", () => {
    expect(ALLOWED_ORIGINS).toContain("http://localhost:9001");
    expect(ALLOWED_ORIGINS).toContain("https://wfa.h3xry.dev");
  });

  it("should have default PORT", () => {
    expect(PORT).toBe(9002);
  });
});
