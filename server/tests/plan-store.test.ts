import { describe, it, expect, beforeEach, vi } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Override PLANS_DIR before importing plan-store
const tmpBase = path.join(os.tmpdir(), "plan-store-test-");
let tmpDir: string;

vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return {
    ...actual,
    default: {
      ...actual.default,
      homedir: () => tmpDir,
    },
  };
});

describe("plan-store", () => {
  let planStore: typeof import("../src/services/plan-store.js");

  beforeEach(async () => {
    tmpDir = await mkdtemp(tmpBase);
    vi.resetModules();
    planStore = await import("../src/services/plan-store.js");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("getPlan returns empty plan when no file exists", async () => {
    const plan = await planStore.getPlan("proj1");
    expect(plan.tasks).toEqual([]);
    expect(plan.milestones).toEqual([]);
    expect(plan.sprints).toEqual([]);
  });

  it("addTask creates task and persists to .md file", async () => {
    const task = await planStore.addTask("proj1", {
      title: "[Feature] Test",
      tags: ["Feature", "High"],
      status: "Backlog",
    });
    expect(task.id).toBe("TASK-001");
    expect(task.title).toBe("[Feature] Test");
    expect(task.tags).toEqual(["Feature", "High"]);
    expect(task.status).toBe("Backlog");

    // Verify file exists
    const content = await readFile(
      path.join(tmpDir, ".cc-monitor", "plans", "proj1", "plan.md"),
      "utf-8",
    );
    expect(content).toContain("[Feature] Test");
    expect(content).toContain("## Backlog");
  });

  it("addTask auto-increments IDs", async () => {
    const t1 = await planStore.addTask("proj1", { title: "Task 1" });
    const t2 = await planStore.addTask("proj1", { title: "Task 2" });
    expect(t1.id).toBe("TASK-001");
    expect(t2.id).toBe("TASK-002");
  });

  it("updateTask changes task fields", async () => {
    await planStore.addTask("proj1", { title: "Original", status: "Backlog" });
    const updated = await planStore.updateTask("proj1", "TASK-001", {
      status: "InProgress",
      done: true,
    });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("InProgress");
    expect(updated!.done).toBe(true);
  });

  it("updateTask returns null for unknown task", async () => {
    const result = await planStore.updateTask("proj1", "TASK-999", { done: true });
    expect(result).toBeNull();
  });

  it("deleteTask removes task", async () => {
    await planStore.addTask("proj1", { title: "To delete" });
    const deleted = await planStore.deleteTask("proj1", "TASK-001");
    expect(deleted).toBe(true);

    const plan = await planStore.getPlan("proj1");
    expect(plan.tasks).toHaveLength(0);
  });

  it("deleteTask returns false for unknown task", async () => {
    const result = await planStore.deleteTask("proj1", "TASK-999");
    expect(result).toBe(false);
  });

  it("addMilestone creates milestone and persists", async () => {
    const ms = await planStore.addMilestone("proj1", {
      title: "MVP",
      deadline: "2026-04-15",
      taskRefs: ["Task 1"],
    });
    expect(ms.id).toBe("MS-001");
    expect(ms.title).toBe("MVP");
    expect(ms.deadline).toBe("2026-04-15");
  });

  it("updateMilestone changes fields", async () => {
    await planStore.addMilestone("proj1", { title: "MVP", deadline: "2026-04-15" });
    const updated = await planStore.updateMilestone("proj1", "MS-001", { deadline: "2026-05-01" });
    expect(updated).not.toBeNull();
    expect(updated!.deadline).toBe("2026-05-01");
  });

  it("deleteMilestone removes milestone", async () => {
    await planStore.addMilestone("proj1", { title: "MVP", deadline: "2026-04-15" });
    expect(await planStore.deleteMilestone("proj1", "MS-001")).toBe(true);
    const plan = await planStore.getPlan("proj1");
    expect(plan.milestones).toHaveLength(0);
  });

  it("addSprint creates sprint and persists", async () => {
    const sp = await planStore.addSprint("proj1", {
      title: "Sprint 1",
      startDate: "2026-03-24",
      endDate: "2026-04-07",
    });
    expect(sp.id).toBe("SP-001");
    expect(sp.startDate).toBe("2026-03-24");
  });

  it("updateSprint changes fields", async () => {
    await planStore.addSprint("proj1", { title: "S1", startDate: "2026-03-24", endDate: "2026-04-07" });
    const updated = await planStore.updateSprint("proj1", "SP-001", { endDate: "2026-04-14" });
    expect(updated).not.toBeNull();
    expect(updated!.endDate).toBe("2026-04-14");
  });

  it("deleteSprint removes sprint", async () => {
    await planStore.addSprint("proj1", { title: "S1", startDate: "2026-03-24", endDate: "2026-04-07" });
    expect(await planStore.deleteSprint("proj1", "SP-001")).toBe(true);
  });

  it("getRawPlan returns empty string when no file", async () => {
    const content = await planStore.getRawPlan("proj1");
    expect(content).toBe("");
  });

  it("saveRawPlan writes content and getRawPlan reads it back", async () => {
    await planStore.saveRawPlan("proj1", "# Custom Plan\n");
    const content = await planStore.getRawPlan("proj1");
    expect(content).toBe("# Custom Plan\n");
  });

  it("rejects invalid projectId with path traversal", async () => {
    await expect(planStore.getPlan("../../etc")).rejects.toThrow("Invalid project ID");
    await expect(planStore.addTask("../evil", { title: "x" })).rejects.toThrow("Invalid project ID");
  });
});

// Need afterEach import
import { afterEach } from "vitest";
