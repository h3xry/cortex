import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { planRouter } from "../src/routes/plans.js";

vi.mock("../src/services/project-store.js", () => ({
  getProject: vi.fn(),
}));

vi.mock("../src/services/plan-store.js", () => ({
  getPlan: vi.fn(),
  savePlan: vi.fn(),
  getRawPlan: vi.fn(),
  saveRawPlan: vi.fn(),
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  addMilestone: vi.fn(),
  updateMilestone: vi.fn(),
  deleteMilestone: vi.fn(),
  addSprint: vi.fn(),
  updateSprint: vi.fn(),
  deleteSprint: vi.fn(),
}));

import * as projectStore from "../src/services/project-store.js";
import * as planStore from "../src/services/plan-store.js";

const mockGetProject = vi.mocked(projectStore.getProject);
const mockGetPlan = vi.mocked(planStore.getPlan);
const mockGetRawPlan = vi.mocked(planStore.getRawPlan);
const mockSaveRawPlan = vi.mocked(planStore.saveRawPlan);
const mockAddTask = vi.mocked(planStore.addTask);
const mockUpdateTask = vi.mocked(planStore.updateTask);
const mockDeleteTask = vi.mocked(planStore.deleteTask);
const mockAddMilestone = vi.mocked(planStore.addMilestone);
const mockDeleteMilestone = vi.mocked(planStore.deleteMilestone);
const mockAddSprint = vi.mocked(planStore.addSprint);
const mockDeleteSprint = vi.mocked(planStore.deleteSprint);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/projects/:id/plan", planRouter);
  return app;
}

const PROJECT = {
  id: "proj1", name: "test", path: "/tmp/test",
  isGitRepo: false, addedAt: "2026-01-01", isPrivate: false,
};

describe("GET /api/projects/:id/plan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns parsed plan", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockGetPlan.mockResolvedValue({ tasks: [], milestones: [], sprints: [] });

    const res = await request(createApp()).get("/api/projects/proj1/plan");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toEqual([]);
    expect(res.body.milestones).toEqual([]);
    expect(res.body.sprints).toEqual([]);
  });

  it("returns 404 for unknown project", async () => {
    mockGetProject.mockResolvedValue(undefined);
    const res = await request(createApp()).get("/api/projects/nope/plan");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/projects/:id/plan/tasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates task", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    const task = {
      id: "TASK-001", title: "New task", description: null,
      tags: ["Feature"], status: "Backlog" as const, subTasks: [],
      effort: null, milestoneId: null, sprintId: null, done: false,
      createdAt: "2026-01-01", updatedAt: "2026-01-01",
    };
    mockAddTask.mockResolvedValue(task);

    const res = await request(createApp())
      .post("/api/projects/proj1/plan/tasks")
      .send({ title: "New task", tags: ["Feature"] });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("TASK-001");
  });

  it("rejects missing title", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    const res = await request(createApp())
      .post("/api/projects/proj1/plan/tasks")
      .send({});
    expect(res.status).toBe(400);
  });

  it("rejects invalid status", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    const res = await request(createApp())
      .post("/api/projects/proj1/plan/tasks")
      .send({ title: "Test", status: "Invalid" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/projects/:id/plan/tasks/:taskId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates task status", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockUpdateTask.mockResolvedValue({
      id: "TASK-001", title: "Test", description: null,
      tags: [], status: "InProgress", subTasks: [],
      effort: null, milestoneId: null, sprintId: null, done: false,
      createdAt: "2026-01-01", updatedAt: "2026-01-01",
    });

    const res = await request(createApp())
      .patch("/api/projects/proj1/plan/tasks/TASK-001")
      .send({ status: "InProgress" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("InProgress");
  });

  it("returns 404 for unknown task", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockUpdateTask.mockResolvedValue(null);
    const res = await request(createApp())
      .patch("/api/projects/proj1/plan/tasks/TASK-999")
      .send({ status: "Done" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/projects/:id/plan/tasks/:taskId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes task", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockDeleteTask.mockResolvedValue(true);
    const res = await request(createApp()).delete("/api/projects/proj1/plan/tasks/TASK-001");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("TASK-001");
  });

  it("returns 404 for unknown task", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockDeleteTask.mockResolvedValue(false);
    const res = await request(createApp()).delete("/api/projects/proj1/plan/tasks/TASK-999");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/projects/:id/plan/raw", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns raw markdown", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockGetRawPlan.mockResolvedValue("# Tasks\n## Backlog\n");
    const res = await request(createApp()).get("/api/projects/proj1/plan/raw");
    expect(res.status).toBe(200);
    expect(res.body.content).toBe("# Tasks\n## Backlog\n");
  });
});

describe("PUT /api/projects/:id/plan/raw", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves raw markdown", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockSaveRawPlan.mockResolvedValue(undefined);
    const res = await request(createApp())
      .put("/api/projects/proj1/plan/raw")
      .send({ content: "# Tasks\n" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("rejects missing content", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    const res = await request(createApp())
      .put("/api/projects/proj1/plan/raw")
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("Milestones CRUD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates milestone", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockAddMilestone.mockResolvedValue({
      id: "MS-001", title: "MVP", deadline: "2026-04-15", taskRefs: [],
    });
    const res = await request(createApp())
      .post("/api/projects/proj1/plan/milestones")
      .send({ title: "MVP", deadline: "2026-04-15" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("MS-001");
  });

  it("deletes milestone", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockDeleteMilestone.mockResolvedValue(true);
    const res = await request(createApp()).delete("/api/projects/proj1/plan/milestones/MS-001");
    expect(res.status).toBe(200);
  });
});

describe("Sprints CRUD", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates sprint", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockAddSprint.mockResolvedValue({
      id: "SP-001", title: "Sprint 1",
      startDate: "2026-03-24", endDate: "2026-04-07", taskRefs: [],
    });
    const res = await request(createApp())
      .post("/api/projects/proj1/plan/sprints")
      .send({ title: "Sprint 1", startDate: "2026-03-24", endDate: "2026-04-07" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("SP-001");
  });

  it("deletes sprint", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockDeleteSprint.mockResolvedValue(true);
    const res = await request(createApp()).delete("/api/projects/proj1/plan/sprints/SP-001");
    expect(res.status).toBe(200);
  });
});
