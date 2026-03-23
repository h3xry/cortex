import { describe, it, expect, vi, beforeEach } from "vitest";
import { execFile } from "node:child_process";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

const mockedExecFile = vi.mocked(execFile);

function mockExecFileSuccess(stdout = "") {
  mockedExecFile.mockImplementation((_cmd, _args, callback: any) => {
    callback(null, { stdout, stderr: "" });
    return {} as any;
  });
}

function mockExecFileError(message = "error") {
  mockedExecFile.mockImplementation((_cmd, _args, callback: any) => {
    callback(new Error(message), { stdout: "", stderr: message });
    return {} as any;
  });
}

// Re-import after mock
async function loadModule() {
  vi.resetModules();
  return await import("../src/services/tmux.js");
}

describe("tmux service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("should call tmux new-session with correct args", async () => {
      mockExecFileSuccess();
      const tmux = await loadModule();
      await tmux.createSession("cc-test1", "/Users/test/project", "claude");

      expect(mockedExecFile).toHaveBeenCalledWith(
        "tmux",
        [
          "new-session",
          "-d",
          "-s",
          "cc-test1",
          "-c",
          "/Users/test/project",
          "sh",
          "-c",
          "claude",
        ],
        expect.any(Function),
      );
    });

    it("should reject invalid session names", async () => {
      const tmux = await loadModule();
      await expect(
        tmux.createSession("test;rm -rf /", "/tmp", "claude"),
      ).rejects.toThrow("Invalid tmux session name");
    });
  });

  describe("killSession", () => {
    it("should call tmux kill-session", async () => {
      mockExecFileSuccess();
      const tmux = await loadModule();
      await tmux.killSession("cc-test1");

      expect(mockedExecFile).toHaveBeenCalledWith(
        "tmux",
        ["kill-session", "-t", "cc-test1"],
        expect.any(Function),
      );
    });

    it("should not throw when session already dead", async () => {
      mockExecFileError("no session");
      const tmux = await loadModule();
      await expect(tmux.killSession("cc-test1")).resolves.toBeUndefined();
    });
  });

  describe("hasSession", () => {
    it("should return true when session exists", async () => {
      mockExecFileSuccess();
      const tmux = await loadModule();
      expect(await tmux.hasSession("cc-test1")).toBe(true);
    });

    it("should return false when session does not exist", async () => {
      mockExecFileError("no session");
      const tmux = await loadModule();
      expect(await tmux.hasSession("cc-test1")).toBe(false);
    });
  });

  describe("listSessions", () => {
    it("should parse session names", async () => {
      mockExecFileSuccess("session1\nsession2\n");
      const tmux = await loadModule();
      expect(await tmux.listSessions()).toEqual(["session1", "session2"]);
    });

    it("should return empty array when no sessions", async () => {
      mockExecFileError("no server running");
      const tmux = await loadModule();
      expect(await tmux.listSessions()).toEqual([]);
    });
  });

  describe("capturePaneOutput", () => {
    it("should return stdout on success", async () => {
      mockExecFileSuccess("line1\nline2\n");
      const tmux = await loadModule();
      expect(await tmux.capturePaneOutput("cc-test1")).toBe("line1\nline2\n");
    });

    it("should call tmux with correct args and default startLine", async () => {
      mockExecFileSuccess("");
      const tmux = await loadModule();
      await tmux.capturePaneOutput("cc-test1");

      expect(mockedExecFile).toHaveBeenCalledWith(
        "tmux",
        ["capture-pane", "-t", "cc-test1", "-p", "-e", "-S", "-500"],
        expect.any(Function),
      );
    });

    it("should accept custom startLine", async () => {
      mockExecFileSuccess("");
      const tmux = await loadModule();
      await tmux.capturePaneOutput("cc-test1", -100);

      expect(mockedExecFile).toHaveBeenCalledWith(
        "tmux",
        ["capture-pane", "-t", "cc-test1", "-p", "-e", "-S", "-100"],
        expect.any(Function),
      );
    });

    it("should return empty string on error", async () => {
      mockExecFileError("no pane");
      const tmux = await loadModule();
      expect(await tmux.capturePaneOutput("cc-test1")).toBe("");
    });

    it("should reject invalid session names", async () => {
      const tmux = await loadModule();
      await expect(
        tmux.capturePaneOutput("bad;name"),
      ).rejects.toThrow("Invalid tmux session name");
    });
  });

  describe("validation across all functions", () => {
    it("killSession should reject invalid session names", async () => {
      const tmux = await loadModule();
      await expect(tmux.killSession("bad;name")).rejects.toThrow(
        "Invalid tmux session name",
      );
    });

    it("hasSession should reject invalid session names", async () => {
      const tmux = await loadModule();
      await expect(tmux.hasSession("bad;name")).rejects.toThrow(
        "Invalid tmux session name",
      );
    });
  });
});
