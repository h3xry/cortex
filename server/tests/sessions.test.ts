import { describe, it, expect, vi, beforeEach } from "vitest";
import { stat } from "node:fs/promises";

vi.mock("node:path", async () => {
  const actual =
    await vi.importActual<typeof import("node:path")>("node:path");
  return {
    ...actual,
    default: {
      ...actual,
      resolve: (...args: string[]) => args[args.length - 1],
    },
  };
});

vi.mock("../src/services/path-guard.js", () => ({
  isPathWithinRoot: vi.fn().mockReturnValue(true),
  getAllowedRoot: vi.fn().mockReturnValue("/home"),
}));

vi.mock("../src/services/tmux.js", () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  killSession: vi.fn().mockResolvedValue(undefined),
  hasSession: vi.fn().mockResolvedValue(true),
  capturePaneOutput: vi.fn().mockResolvedValue(""),
  sendKeys: vi.fn().mockResolvedValue(undefined),
  getPipeFilePath: vi.fn().mockReturnValue("/tmp/test.log"),
  startPipePane: vi.fn().mockResolvedValue(undefined),
  tailFile: vi.fn().mockReturnValue({ on: vi.fn(), kill: vi.fn() }),
}));

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    stat: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
  };
});

const mockedStat = vi.mocked(stat);

async function loadModule() {
  vi.resetModules();
  return await import("../src/services/session-manager.js");
}

describe("session-manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedStat.mockResolvedValue({ isDirectory: () => true } as any);
  });

  describe("createSession", () => {
    it("should create a session with running status", async () => {
      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");

      expect(session.id).toBeDefined();
      expect(session.folderPath).toBe("/tmp");
      expect(session.status).toBe("running");
      expect(session.createdAt).toBeDefined();
      expect(session.endedAt).toBeNull();
    });

    it("should reject non-directory paths", async () => {
      mockedStat.mockResolvedValue({ isDirectory: () => false } as any);
      const mgr = await loadModule();
      await expect(mgr.createSession("/tmp/file.txt")).rejects.toThrow(
        "Path is not a directory",
      );
    });

    it("should reject nonexistent paths", async () => {
      mockedStat.mockResolvedValue(null as any);
      const mgr = await loadModule();
      await expect(mgr.createSession("/nonexistent")).rejects.toThrow(
        "Folder does not exist",
      );
    });
  });

  describe("getSession", () => {
    it("should return session by id", async () => {
      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");
      const found = mgr.getSession(session.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(session.id);
    });

    it("should return undefined for unknown id", async () => {
      const mgr = await loadModule();
      expect(mgr.getSession("nonexistent")).toBeUndefined();
    });
  });

  describe("listSessions", () => {
    it("should return all sessions", async () => {
      const mgr = await loadModule();
      await mgr.createSession("/tmp");
      await mgr.createSession("/tmp");
      const list = mgr.listSessions();
      expect(list.length).toBe(2);
    });
  });

  describe("deleteSession", () => {
    it("should mark session as ended", async () => {
      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");
      const deleted = await mgr.deleteSession(session.id);
      expect(deleted.status).toBe("ended");
      expect(deleted.endedAt).toBeDefined();
    });

    it("should throw SessionNotFoundError for unknown session", async () => {
      const mgr = await loadModule();
      await expect(mgr.deleteSession("nonexistent")).rejects.toThrow(
        "Session not found",
      );
    });
  });

  describe("getOutputBuffer", () => {
    it("should return empty string for new session", async () => {
      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");
      expect(mgr.getOutputBuffer(session.id)).toBe("");
    });

    it("should return empty string for unknown session", async () => {
      const mgr = await loadModule();
      expect(mgr.getOutputBuffer("nonexistent")).toBe("");
    });
  });

  describe("getSessionStatus", () => {
    it("should return status of existing session", async () => {
      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");
      expect(mgr.getSessionStatus(session.id)).toBe("running");
    });

    it("should return undefined for unknown session", async () => {
      const mgr = await loadModule();
      expect(mgr.getSessionStatus("nonexistent")).toBeUndefined();
    });
  });

  describe("addOutputListener", () => {
    it("should throw SessionNotFoundError for unknown session", async () => {
      const mgr = await loadModule();
      expect(() => mgr.addOutputListener("nonexistent", () => {})).toThrow(
        "Session not found",
      );
    });

    it("should return cleanup function", async () => {
      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");
      const cleanup = mgr.addOutputListener(session.id, () => {});
      expect(typeof cleanup).toBe("function");
      cleanup();
    });
  });
});
