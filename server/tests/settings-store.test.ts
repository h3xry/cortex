import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { readFile, writeFile, mkdir } from "node:fs/promises";

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);

async function loadModule() {
  vi.resetModules();
  return await import("../src/services/settings-store.js");
}

describe("settings-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it("returns null when no settings file exists", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    const store = await loadModule();
    const hash = await store.getPasswordHash();
    expect(hash).toBeNull();
  });

  it("returns false for hasPassword when no password set", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    const store = await loadModule();
    expect(await store.hasPassword()).toBe(false);
  });

  it("loads existing settings", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ privatePasswordHash: "salt:hash" }),
    );
    const store = await loadModule();
    const hash = await store.getPasswordHash();
    expect(hash).toBe("salt:hash");
    expect(await store.hasPassword()).toBe(true);
  });

  it("saves password hash", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    const store = await loadModule();
    await store.setPasswordHash("newsalt:newhash");
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("settings.json"),
      expect.stringContaining("newsalt:newhash"),
    );
  });

  it("caches after first load", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ privatePasswordHash: null }),
    );
    const store = await loadModule();
    await store.getPasswordHash();
    await store.getPasswordHash();
    // readFile called only once (cached)
    expect(mockReadFile).toHaveBeenCalledTimes(1);
  });
});
