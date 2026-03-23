import { describe, it, expect } from "vitest";
import { ALLOWED_ORIGIN, PORT } from "../src/config.js";

describe("config", () => {
  it("should have default ALLOWED_ORIGIN", () => {
    expect(ALLOWED_ORIGIN).toBe("http://localhost:9001");
  });

  it("should have default PORT", () => {
    expect(PORT).toBe(9002);
  });
});
