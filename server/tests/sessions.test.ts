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

// Fake child process that captures event handlers for testing
function createFakeTailProcess() {
  const handlers = new Map<string, Function>();
  return {
    on: vi.fn((event: string, handler: Function) => {
      handlers.set(event, handler);
    }),
    kill: vi.fn(),
    stdout: { on: vi.fn() },
    _handlers: handlers,
    _triggerExit: (code: number | null) => handlers.get("exit")?.(code),
  };
}

let latestTailProcess = createFakeTailProcess();

vi.mock("../src/services/tmux.js", () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  killSession: vi.fn().mockResolvedValue(undefined),
  hasSession: vi.fn().mockResolvedValue(true),
  capturePaneOutput: vi.fn().mockResolvedValue(""),
  sendKeys: vi.fn().mockResolvedValue(undefined),
  getPipeFilePath: vi.fn().mockReturnValue("/tmp/test.log"),
  startPipePane: vi.fn().mockResolvedValue(undefined),
  tailFile: vi.fn().mockImplementation(() => latestTailProcess),
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
    mockedStat.mockResolvedValue({ isDirectory: () => true, size: 1 } as any);
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

  describe("tail restart on exit", () => {
    beforeEach(() => {
      latestTailProcess = createFakeTailProcess();
    });

    // Helper: flush microtasks (let promises resolve)
    const flush = () => new Promise((r) => setTimeout(r, 50));

    it("should restart tail when process exits and tmux session is alive", async () => {
      const tmuxMock = await import("../src/services/tmux.js");
      vi.mocked(tmuxMock.hasSession).mockResolvedValue(true);

      const mgr = await loadModule();
      await mgr.createSession("/tmp");

      const exitHandler = latestTailProcess._handlers.get("exit");
      expect(exitHandler).toBeDefined();

      latestTailProcess = createFakeTailProcess();
      exitHandler!(1);

      // Wait for hasSession promise + 1s backoff + margin
      await new Promise((r) => setTimeout(r, 1500));

      expect(vi.mocked(tmuxMock.tailFile).mock.calls.length).toBeGreaterThanOrEqual(2);
    }, 10000);

    it("should mark session ended when tmux session is gone", async () => {
      const tmuxMock = await import("../src/services/tmux.js");
      vi.mocked(tmuxMock.hasSession).mockResolvedValue(true);

      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");

      // Now mock hasSession to return false for the exit handler check
      vi.mocked(tmuxMock.hasSession).mockResolvedValue(false);

      const exitHandler = latestTailProcess._handlers.get("exit");
      exitHandler!(1);

      await flush();

      expect(mgr.getSessionStatus(session.id)).toBe("ended");
    }, 10000);

    it("should not restart when session is already ended", async () => {
      const tmuxMock = await import("../src/services/tmux.js");
      vi.mocked(tmuxMock.hasSession).mockResolvedValue(true);

      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");

      await mgr.deleteSession(session.id);

      const callCountBefore = vi.mocked(tmuxMock.tailFile).mock.calls.length;

      const exitHandler = latestTailProcess._handlers.get("exit");
      if (exitHandler) exitHandler(0);

      await flush();

      expect(vi.mocked(tmuxMock.tailFile).mock.calls.length).toBe(callCountBefore);
    }, 10000);
  });
});
