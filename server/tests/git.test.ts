import { describe, it, expect, vi, beforeEach } from "vitest";
import { execFile } from "node:child_process";
import { access } from "node:fs/promises";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  access: vi.fn(),
}));

const mockedExecFile = vi.mocked(execFile);
const mockedAccess = vi.mocked(access);

function mockExecFileSuccess(stdout = "") {
  mockedExecFile.mockImplementation((_cmd, _args, _opts, callback?: any) => {
    const cb = typeof _opts === "function" ? _opts : callback;
    cb(null, { stdout, stderr: "" });
    return {} as any;
  });
}

async function loadModule() {
  vi.resetModules();
  return await import("../src/services/git.js");
}

describe("git service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isGitRepo", () => {
    it("should return true when .git exists", async () => {
      mockedAccess.mockResolvedValue(undefined);
      const git = await loadModule();
      expect(await git.isGitRepo("/tmp/project")).toBe(true);
    });

    it("should return false when .git missing", async () => {
      mockedAccess.mockRejectedValue(new Error("ENOENT"));
      const git = await loadModule();
      expect(await git.isGitRepo("/tmp/project")).toBe(false);
    });
  });

  describe("getBranch", () => {
    it("should return branch name", async () => {
      mockExecFileSuccess("main\n");
      const git = await loadModule();
      expect(await git.getBranch("/tmp/project")).toBe("main");
    });
  });

  describe("getStatus", () => {
    it("should parse modified files", async () => {
      mockExecFileSuccess(" M src/index.ts\n?? new-file.ts\n");
      const git = await loadModule();
      const changes = await git.getStatus("/tmp/project");
      expect(changes).toHaveLength(2);
      expect(changes[0].status).toBe("modified");
      expect(changes[1].status).toBe("added");
    });

    it("should return empty array for clean repo", async () => {
      mockExecFileSuccess("");
      const git = await loadModule();
      const changes = await git.getStatus("/tmp/project");
      expect(changes).toEqual([]);
    });
  });

  describe("getDiff", () => {
    it("should parse diff hunks", async () => {
      const diffOutput = `diff --git a/file.ts b/file.ts
index abc..def 100644
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
 line1
-old line
+new line
+added line
 line3
`;
      mockExecFileSuccess(diffOutput);
      const git = await loadModule();
      const diff = await git.getDiff("/tmp/project", "file.ts");
      expect(diff.hunks).toHaveLength(1);
      expect(diff.hunks[0].lines).toHaveLength(5);
      expect(diff.hunks[0].lines[0].type).toBe("context");
      expect(diff.hunks[0].lines[1].type).toBe("delete");
      expect(diff.hunks[0].lines[2].type).toBe("add");
      expect(diff.hunks[0].lines[3].type).toBe("add");
      expect(diff.hunks[0].lines[4].type).toBe("context");
    });
  });
});
