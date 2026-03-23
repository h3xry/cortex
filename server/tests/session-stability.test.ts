import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { stat } from "node:fs/promises";
import { EventEmitter } from "node:events";

// Track tailFile mock instances so tests can simulate exit/error
let tailEmitters: EventEmitter[] = [];

function createMockTailProcess(): EventEmitter & { kill: ReturnType<typeof vi.fn> } {
  const emitter = Object.assign(new EventEmitter(), { kill: vi.fn() });
  tailEmitters.push(emitter);
  return emitter;
}

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

const mockHasSession = vi.fn().mockResolvedValue(true);

vi.mock("../src/services/tmux.js", () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  killSession: vi.fn().mockResolvedValue(undefined),
  hasSession: mockHasSession,
  capturePaneOutput: vi.fn().mockResolvedValue(""),
  sendKeys: vi.fn().mockResolvedValue(undefined),
  getPipeFilePath: vi.fn().mockReturnValue("/tmp/test.log"),
  startPipePane: vi.fn().mockResolvedValue(undefined),
  tailFile: vi.fn().mockImplementation(() => createMockTailProcess()),
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
  tailEmitters = [];
  return await import("../src/services/session-manager.js");
}

describe("session-stability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockedStat.mockResolvedValue({ isDirectory: () => true, size: 1 } as any);
    mockHasSession.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("tail restart on exit", () => {
    it("should restart tail when process exits and tmux session is alive", async () => {
      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");

      expect(tailEmitters).toHaveLength(1);

      // Simulate tail exit
      tailEmitters[0].emit("exit", 1);

      // Let the hasSession promise resolve
      await vi.advanceTimersByTimeAsync(0);

      // Backoff delay: 1s for first attempt
      await vi.advanceTimersByTimeAsync(1000);

      // Should have spawned a new tail process
      expect(tailEmitters).toHaveLength(2);
    });

    it("should mark session as ended when tmux session is gone", async () => {
      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");

      mockHasSession.mockResolvedValue(false);
      tailEmitters[0].emit("exit", 1);

      await vi.advanceTimersByTimeAsync(0);

      expect(mgr.getSessionStatus(session.id)).toBe("ended");
    });

    it("should not restart when session is already ended", async () => {
      const mgr = await loadModule();
      const session = await mgr.createSession("/tmp");

      await mgr.deleteSession(session.id);
      expect(mgr.getSessionStatus(session.id)).toBe("ended");

      tailEmitters[0].emit("exit", 1);
      await vi.advanceTimersByTimeAsync(5000);

      // No new tail process — still just the original one
      expect(tailEmitters).toHaveLength(1);
    });
  });

  describe("circuit breaker", () => {
    it("should stop restarting after 3 failures within 30s", async () => {
      const mgr = await loadModule();
      await mgr.createSession("/tmp");

      // Failure 1
      tailEmitters[0].emit("exit", 1);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000); // 1s backoff
      expect(tailEmitters).toHaveLength(2);

      // Failure 2
      tailEmitters[1].emit("exit", 1);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(2000); // 2s backoff
      expect(tailEmitters).toHaveLength(3);

      // Failure 3
      tailEmitters[2].emit("exit", 1);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(4000); // 4s backoff
      expect(tailEmitters).toHaveLength(4);

      // Failure 4 — circuit breaker should stop restart
      tailEmitters[3].emit("exit", 1);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(10000);

      // No 5th tail process
      expect(tailEmitters).toHaveLength(4);
    });

    it("should reset counter after 30s of stability", async () => {
      const mgr = await loadModule();
      await mgr.createSession("/tmp");

      // Failure 1
      tailEmitters[0].emit("exit", 1);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      expect(tailEmitters).toHaveLength(2);

      // Wait 31s (past the retry window)
      await vi.advanceTimersByTimeAsync(31_000);

      // Failure 2 — counter should have reset, so this counts as attempt 1 again
      tailEmitters[1].emit("exit", 1);
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000); // 1s backoff (not 2s)
      expect(tailEmitters).toHaveLength(3);
    });
  });

  describe("listener isolation", () => {
    it("should remove broken listener without affecting others", async () => {
      const mgr = await loadModule();
      const tmuxMock = await import("../src/services/tmux.js");
      const session = await mgr.createSession("/tmp");

      const goodListener = vi.fn();
      const badListener = vi.fn().mockImplementation(() => {
        throw new Error("listener crash");
      });

      mgr.addOutputListener(session.id, badListener);
      mgr.addOutputListener(session.id, goodListener);

      // Get the onData callback passed to tailFile
      const tailFileMock = vi.mocked(tmuxMock.tailFile);
      const onData = tailFileMock.mock.calls[0][1];

      // Simulate data arriving
      onData(Buffer.from("hello"));

      // Bad listener was called and threw
      expect(badListener).toHaveBeenCalledTimes(1);
      // Good listener still received data
      expect(goodListener).toHaveBeenCalledWith("hello");

      // Send more data — bad listener should be removed
      onData(Buffer.from("world"));
      expect(badListener).toHaveBeenCalledTimes(1); // NOT called again
      expect(goodListener).toHaveBeenCalledTimes(2);
    });
  });
});
