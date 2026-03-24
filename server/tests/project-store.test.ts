import { describe, it, expect, vi, beforeEach } from "vitest";
import { stat, access, readFile, writeFile, mkdir } from "node:fs/promises";

vi.mock("node:fs/promises", () => ({
  stat: vi.fn(),
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

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

const mockedStat = vi.mocked(stat);
const mockedAccess = vi.mocked(access);
const mockedReadFile = vi.mocked(readFile);

async function loadModule() {
  vi.resetModules();
  return await import("../src/services/project-store.js");
}

describe("project-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedStat.mockResolvedValue({ isDirectory: () => true } as any);
    mockedAccess.mockRejectedValue(new Error("no .git"));
    mockedReadFile.mockRejectedValue(new Error("ENOENT"));
  });

  describe("addProject", () => {
    it("should add a project and return it", async () => {
      const store = await loadModule();
      const project = await store.addProject("/tmp/myproject");
      expect(project.id).toBeDefined();
      expect(project.name).toBe("myproject");
      expect(project.isGitRepo).toBe(false);
    });

    it("should detect git repo", async () => {
      mockedAccess.mockResolvedValue(undefined);
      const store = await loadModule();
      const project = await store.addProject("/tmp/gitproject");
      expect(project.isGitRepo).toBe(true);
    });

    it("should reject non-existent path", async () => {
      mockedStat.mockResolvedValue(null as any);
      const store = await loadModule();
      await expect(store.addProject("/nonexistent")).rejects.toThrow(
        "Path does not exist",
      );
    });

    it("should reject duplicate path", async () => {
      const store = await loadModule();
      await store.addProject("/tmp/myproject");
      await expect(store.addProject("/tmp/myproject")).rejects.toThrow(
        "Project already added",
      );
    });
  });

  describe("listProjects", () => {
    it("should return added projects", async () => {
      const store = await loadModule();
      await store.addProject("/tmp/project1");
      await store.addProject("/tmp/project2");
      const list = await store.listProjects();
      expect(list).toHaveLength(2);
    });
  });

  describe("getProject", () => {
    it("should return project by id", async () => {
      const store = await loadModule();
      const added = await store.addProject("/tmp/myproject");
      const found = await store.getProject(added.id);
      expect(found?.id).toBe(added.id);
    });

    it("should return undefined for unknown id", async () => {
      const store = await loadModule();
      const found = await store.getProject("nonexistent");
      expect(found).toBeUndefined();
    });
  });

  describe("setGroupId", () => {
    it("should set project groupId", async () => {
      const store = await loadModule();
      const added = await store.addProject("/tmp/myproject");
      expect(added.groupId).toBeNull();
      const updated = await store.setGroupId(added.id, "g1");
      expect(updated.groupId).toBe("g1");
    });

    it("should remove groupId", async () => {
      const store = await loadModule();
      const added = await store.addProject("/tmp/myproject");
      await store.setGroupId(added.id, "g1");
      const updated = await store.setGroupId(added.id, null);
      expect(updated.groupId).toBeNull();
    });

    it("should throw for unknown project", async () => {
      const store = await loadModule();
      await expect(store.setGroupId("nonexistent", "g1")).rejects.toThrow(
        "Project not found",
      );
    });
  });

  describe("removeProject", () => {
    it("should remove a project", async () => {
      const store = await loadModule();
      const added = await store.addProject("/tmp/myproject");
      await store.removeProject(added.id);
      const list = await store.listProjects();
      expect(list).toHaveLength(0);
    });

    it("should throw for unknown project", async () => {
      const store = await loadModule();
      await expect(store.removeProject("nonexistent")).rejects.toThrow(
        "Project not found",
      );
    });
  });
});
