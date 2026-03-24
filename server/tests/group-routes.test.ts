import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { groupRouter } from "../src/routes/groups.js";

vi.mock("../src/services/group-store.js", () => ({
  listGroups: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  reorderGroups: vi.fn(),
}));

vi.mock("../src/services/project-store.js", () => ({
  unlinkGroup: vi.fn(),
}));

import * as groupStore from "../src/services/group-store.js";
import * as projectStore from "../src/services/project-store.js";

const mockListGroups = vi.mocked(groupStore.listGroups);
const mockCreateGroup = vi.mocked(groupStore.createGroup);
const mockUpdateGroup = vi.mocked(groupStore.updateGroup);
const mockDeleteGroup = vi.mocked(groupStore.deleteGroup);
const mockReorderGroups = vi.mocked(groupStore.reorderGroups);
const mockUnlinkGroup = vi.mocked(projectStore.unlinkGroup);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/groups", groupRouter);
  return app;
}

describe("GET /api/groups", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns groups list", async () => {
    mockListGroups.mockResolvedValue([
      { id: "g1", name: "Work", icon: "🏢", color: "#89b4fa", order: 0, createdAt: "2026-01-01" },
    ]);
    const res = await request(createApp()).get("/api/groups");
    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(1);
  });
});

describe("POST /api/groups", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates group", async () => {
    mockCreateGroup.mockResolvedValue({
      id: "g1", name: "Work", icon: "🏢", color: "#89b4fa", order: 0, createdAt: "2026-01-01",
    });
    const res = await request(createApp())
      .post("/api/groups")
      .send({ name: "Work", icon: "🏢", color: "#89b4fa" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Work");
  });

  it("rejects missing name", async () => {
    const res = await request(createApp())
      .post("/api/groups")
      .send({ icon: "🏢", color: "#89b4fa" });
    expect(res.status).toBe(400);
  });

  it("rejects missing icon", async () => {
    const res = await request(createApp())
      .post("/api/groups")
      .send({ name: "Work", color: "#89b4fa" });
    expect(res.status).toBe(400);
  });

  it("rejects invalid color", async () => {
    const res = await request(createApp())
      .post("/api/groups")
      .send({ name: "Work", icon: "🏢", color: "not-hex" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/groups/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates group", async () => {
    mockUpdateGroup.mockResolvedValue({
      id: "g1", name: "Updated", icon: "🏢", color: "#f38ba8", order: 0, createdAt: "2026-01-01",
    });
    const res = await request(createApp())
      .patch("/api/groups/g1")
      .send({ name: "Updated", color: "#f38ba8" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
  });

  it("returns 404 for unknown group", async () => {
    mockUpdateGroup.mockResolvedValue(null);
    const res = await request(createApp())
      .patch("/api/groups/nope")
      .send({ name: "x" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/groups/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes group and unlinks projects", async () => {
    mockDeleteGroup.mockResolvedValue(true);
    mockUnlinkGroup.mockResolvedValue(undefined);
    const res = await request(createApp()).delete("/api/groups/g1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("g1");
    expect(mockUnlinkGroup).toHaveBeenCalledWith("g1");
  });

  it("returns 404 for unknown group", async () => {
    mockDeleteGroup.mockResolvedValue(false);
    const res = await request(createApp()).delete("/api/groups/nope");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/groups/reorder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reorders groups", async () => {
    mockReorderGroups.mockResolvedValue(true);
    const res = await request(createApp())
      .put("/api/groups/reorder")
      .send({ order: ["g2", "g1"] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("rejects non-array order", async () => {
    const res = await request(createApp())
      .put("/api/groups/reorder")
      .send({ order: "not-array" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid ids", async () => {
    mockReorderGroups.mockResolvedValue(false);
    const res = await request(createApp())
      .put("/api/groups/reorder")
      .send({ order: ["invalid"] });
    expect(res.status).toBe(400);
  });
});
