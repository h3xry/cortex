import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { projectsRouter } from "../src/routes/projects.js";

vi.mock("../src/services/project-store.js", () => ({
  listProjects: vi.fn(),
  addProject: vi.fn(),
  removeProject: vi.fn(),
  setGroupId: vi.fn(),
}));

vi.mock("../src/services/group-store.js", () => ({
  getPrivateGroupIds: vi.fn().mockResolvedValue(new Set()),
  getGroup: vi.fn(),
}));

vi.mock("../src/services/unlock-store.js", () => ({
  isUnlockedHeader: vi.fn(),
}));

import * as projectStore from "../src/services/project-store.js";
import * as groupStore from "../src/services/group-store.js";
import * as unlockStore from "../src/services/unlock-store.js";

const mockListProjects = vi.mocked(projectStore.listProjects);
const mockGetPrivateGroupIds = vi.mocked(groupStore.getPrivateGroupIds);
const mockIsUnlockedHeader = vi.mocked(unlockStore.isUnlockedHeader);

const ungroupedProject = {
  id: "pub1", name: "public", path: "/tmp/public",
  isGitRepo: false, addedAt: "2026-01-01", groupId: null,
};
const groupedProject = {
  id: "grp1", name: "grouped", path: "/tmp/grouped",
  isGitRepo: false, addedAt: "2026-01-01", groupId: "g-private",
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/projects", projectsRouter);
  return app;
}

describe("GET /api/projects", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all projects when unlocked", async () => {
    mockListProjects.mockResolvedValue([ungroupedProject, groupedProject]);
    mockIsUnlockedHeader.mockReturnValue(true);

    const res = await request(createApp()).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(2);
  });

  it("filters out projects in private groups when locked", async () => {
    mockListProjects.mockResolvedValue([ungroupedProject, groupedProject]);
    mockIsUnlockedHeader.mockReturnValue(false);
    mockGetPrivateGroupIds.mockResolvedValue(new Set(["g-private"]));

    const res = await request(createApp()).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(1);
    expect(res.body.projects[0].id).toBe("pub1");
  });

  it("returns all projects when no private groups exist", async () => {
    mockListProjects.mockResolvedValue([ungroupedProject, groupedProject]);
    mockIsUnlockedHeader.mockReturnValue(false);
    mockGetPrivateGroupIds.mockResolvedValue(new Set());

    const res = await request(createApp()).get("/api/projects");
    expect(res.body.projects).toHaveLength(2);
  });
});
