import { describe, it, expect, vi, beforeEach } from "vitest";
import os from "node:os";
import path from "node:path";

describe("path-guard", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function loadModule() {
    return await import("../src/services/path-guard.js");
  }

  it("should allow paths within home directory", async () => {
    const guard = await loadModule();
    const home = os.homedir();
    expect(guard.isPathWithinRoot(home)).toBe(true);
    expect(guard.isPathWithinRoot(path.join(home, "Work"))).toBe(true);
    expect(guard.isPathWithinRoot(path.join(home, "Work", "project"))).toBe(
      true,
    );
  });

  it("should reject paths outside home directory", async () => {
    const guard = await loadModule();
    expect(guard.isPathWithinRoot("/etc")).toBe(false);
    expect(guard.isPathWithinRoot("/tmp")).toBe(false);
    expect(guard.isPathWithinRoot("/root")).toBe(false);
  });

  it("should reject path traversal attempts", async () => {
    const guard = await loadModule();
    const home = os.homedir();
    expect(guard.isPathWithinRoot(path.join(home, "..", ".."))).toBe(false);
    expect(guard.isPathWithinRoot(home + "/../../../etc/passwd")).toBe(false);
  });

  it("should return the allowed root", async () => {
    const guard = await loadModule();
    expect(guard.getAllowedRoot()).toBe(path.resolve(os.homedir()));
  });
});
