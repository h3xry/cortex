import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { projectsRouter } from "../src/routes/projects.js";

vi.mock("../src/services/project-store.js", () => ({
  listProjects: vi.fn(),
  addProject: vi.fn(),
  removeProject: vi.fn(),
  setPrivate: vi.fn(),
}));

vi.mock("../src/services/settings-store.js", () => ({
  getPasswordHash: vi.fn(),
}));

vi.mock("../src/services/crypto.js", () => ({
  verifyPassword: vi.fn(),
}));

vi.mock("../src/services/unlock-store.js", () => ({
  isUnlockedHeader: vi.fn(),
}));

import * as projectStore from "../src/services/project-store.js";
import * as settingsStore from "../src/services/settings-store.js";
import * as crypto from "../src/services/crypto.js";
import * as unlockStore from "../src/services/unlock-store.js";

const mockListProjects = vi.mocked(projectStore.listProjects);
const mockSetPrivate = vi.mocked(projectStore.setPrivate);
const mockGetPasswordHash = vi.mocked(settingsStore.getPasswordHash);
const mockVerifyPassword = vi.mocked(crypto.verifyPassword);
const mockIsUnlockedHeader = vi.mocked(unlockStore.isUnlockedHeader);

const publicProject = {
  id: "pub1", name: "public", path: "/tmp/public",
  isGitRepo: false, addedAt: "2026-01-01", isPrivate: false,
};
const privateProject = {
  id: "priv1", name: "secret", path: "/tmp/secret",
  isGitRepo: false, addedAt: "2026-01-01", isPrivate: true,
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
    mockListProjects.mockResolvedValue([publicProject, privateProject]);
    mockIsUnlockedHeader.mockReturnValue(true);

    const res = await request(createApp()).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(2);
  });

  it("filters out private projects when locked", async () => {
    mockListProjects.mockResolvedValue([publicProject, privateProject]);
    mockIsUnlockedHeader.mockReturnValue(false);

    const res = await request(createApp()).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(1);
    expect(res.body.projects[0].id).toBe("pub1");
  });

  it("returns empty array when all projects are private and locked", async () => {
    mockListProjects.mockResolvedValue([privateProject]);
    mockIsUnlockedHeader.mockReturnValue(false);

    const res = await request(createApp()).get("/api/projects");
    expect(res.body.projects).toHaveLength(0);
  });
});

describe("PATCH /api/projects/:id/private", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects missing fields", async () => {
    const res = await request(createApp())
      .patch("/api/projects/abc123/private")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/);
  });

  it("rejects when no global password set", async () => {
    mockGetPasswordHash.mockResolvedValue(null);
    const res = await request(createApp())
      .patch("/api/projects/abc123/private")
      .send({ isPrivate: true, password: "test1234" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No private password set/);
  });

  it("rejects wrong password", async () => {
    mockGetPasswordHash.mockResolvedValue("salt:hash");
    mockVerifyPassword.mockResolvedValue(false);
    const res = await request(createApp())
      .patch("/api/projects/abc123/private")
      .send({ isPrivate: true, password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("sets project private with correct password", async () => {
    mockGetPasswordHash.mockResolvedValue("salt:hash");
    mockVerifyPassword.mockResolvedValue(true);
    mockSetPrivate.mockResolvedValue({
      id: "abc123", name: "test", path: "/tmp/test",
      isGitRepo: false, addedAt: "2026-01-01T00:00:00Z", isPrivate: true,
    });
    const res = await request(createApp())
      .patch("/api/projects/abc123/private")
      .send({ isPrivate: true, password: "correct" });
    expect(res.status).toBe(200);
    expect(res.body.isPrivate).toBe(true);
  });

  it("returns 404 for non-existent project", async () => {
    mockGetPasswordHash.mockResolvedValue("salt:hash");
    mockVerifyPassword.mockResolvedValue(true);
    mockSetPrivate.mockRejectedValue(new Error("Project not found"));
    const res = await request(createApp())
      .patch("/api/projects/notfound/private")
      .send({ isPrivate: true, password: "correct" });
    expect(res.status).toBe(404);
  });
});
