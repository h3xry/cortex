import { describe, it, expect } from "vitest";
import { parsePlanMd, serializePlan } from "../src/services/plan-parser.js";

const SAMPLE_MD = `# Tasks

## Backlog
- [ ] **[Feature] ระบบจัดส่ง (Shipping)** - [High] [Sell-sync-api]
  - [ ] เลือก Provider — Back 1.5 manday
  - [ ] ตั้งค่าค่าส่ง — Back 1 manday

## Sprint

## In Progress
- [ ] **[Feature] ระบบจัดการสินค้า** - [Sell-sync-api]
  - [x] สร้างสินค้าในระบบ
  - [ ] ตัดยอดเมื่อมีการสั่งซื้อ

## Review
- [x] **[Feature] ตั้งค่าร้านค้า** - [Sell-sync-api]
  - [x] เชื่อมต่อร้านค้า

## Done
- [x] **~~Worker - Fetch TikTok Live Comments~~**

---

# Milestones

## MVP Launch - 2026-04-15
- ระบบไลฟ์สด
- ระบบจัดการสินค้า

## Beta Release - 2026-05-01
- ระบบจัดส่ง

---

# Sprints

## Sprint 1 - 2026-03-24 to 2026-04-07
- ระบบไลฟ์สด

## Sprint 2 - 2026-04-07 to 2026-04-21
- ระบบจัดส่ง
`;

describe("parsePlanMd", () => {
  it("parses tasks with correct status mapping", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    expect(plan.tasks).toHaveLength(4);
    expect(plan.tasks[0].status).toBe("Backlog");
    expect(plan.tasks[1].status).toBe("InProgress");
    expect(plan.tasks[2].status).toBe("Review");
    expect(plan.tasks[3].status).toBe("Done");
  });

  it("parses task title and tags", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    const task = plan.tasks[0];
    expect(task.title).toBe("[Feature] ระบบจัดส่ง (Shipping)");
    expect(task.tags).toContain("Feature");
    expect(task.tags).toContain("High");
    expect(task.tags).toContain("Sell-sync-api");
  });

  it("parses sub-tasks with effort", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    const task = plan.tasks[0];
    expect(task.subTasks).toHaveLength(2);
    expect(task.subTasks[0].title).toBe("เลือก Provider");
    expect(task.subTasks[0].effort).toBe("Back 1.5 manday");
    expect(task.subTasks[0].done).toBe(false);
  });

  it("parses done checkbox", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    expect(plan.tasks[0].done).toBe(false);
    expect(plan.tasks[2].done).toBe(true); // Review task [x]
    expect(plan.tasks[3].done).toBe(true); // Done task [x]
  });

  it("parses sub-task done state", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    const task = plan.tasks[1]; // In Progress
    expect(task.subTasks[0].done).toBe(true); // [x]
    expect(task.subTasks[1].done).toBe(false); // [ ]
  });

  it("parses strikethrough title in Done section", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    const doneTask = plan.tasks[3];
    expect(doneTask.title).toBe("Worker - Fetch TikTok Live Comments");
    expect(doneTask.done).toBe(true);
  });

  it("auto-generates sequential task IDs", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    expect(plan.tasks[0].id).toBe("TASK-001");
    expect(plan.tasks[1].id).toBe("TASK-002");
    expect(plan.tasks[2].id).toBe("TASK-003");
    expect(plan.tasks[3].id).toBe("TASK-004");
  });

  it("parses milestones with deadline and taskRefs", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    expect(plan.milestones).toHaveLength(2);
    expect(plan.milestones[0].title).toBe("MVP Launch");
    expect(plan.milestones[0].deadline).toBe("2026-04-15");
    expect(plan.milestones[0].taskRefs).toEqual(["ระบบไลฟ์สด", "ระบบจัดการสินค้า"]);
    expect(plan.milestones[0].id).toBe("MS-001");
  });

  it("parses sprints with date range and taskRefs", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    expect(plan.sprints).toHaveLength(2);
    expect(plan.sprints[0].title).toBe("Sprint 1");
    expect(plan.sprints[0].startDate).toBe("2026-03-24");
    expect(plan.sprints[0].endDate).toBe("2026-04-07");
    expect(plan.sprints[0].taskRefs).toEqual(["ระบบไลฟ์สด"]);
    expect(plan.sprints[0].id).toBe("SP-001");
  });

  it("returns empty plan for empty content", () => {
    const plan = parsePlanMd("");
    expect(plan.tasks).toEqual([]);
    expect(plan.milestones).toEqual([]);
    expect(plan.sprints).toEqual([]);
  });

  it("handles empty sections gracefully", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    // Sprint section is empty in sample
    const sprintTasks = plan.tasks.filter((t) => t.status === "Sprint");
    expect(sprintTasks).toHaveLength(0);
  });
});

describe("serializePlan", () => {
  it("roundtrips parsed plan back to markdown", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    const output = serializePlan(plan);

    // Re-parse to verify structure is maintained
    const reparsed = parsePlanMd(output);
    expect(reparsed.tasks).toHaveLength(plan.tasks.length);
    expect(reparsed.milestones).toHaveLength(plan.milestones.length);
    expect(reparsed.sprints).toHaveLength(plan.sprints.length);

    // Verify task data survives roundtrip
    expect(reparsed.tasks[0].title).toBe(plan.tasks[0].title);
    expect(reparsed.tasks[0].status).toBe(plan.tasks[0].status);
    expect(reparsed.tasks[0].subTasks).toHaveLength(plan.tasks[0].subTasks.length);
  });

  it("serializes empty plan", () => {
    const output = serializePlan({ tasks: [], milestones: [], sprints: [] });
    expect(output).toContain("# Tasks");
    expect(output).toContain("## Backlog");
    expect(output).not.toContain("# Milestones");
  });

  it("marks done tasks with strikethrough", () => {
    const plan = parsePlanMd(SAMPLE_MD);
    const output = serializePlan(plan);
    expect(output).toContain("~~Worker - Fetch TikTok Live Comments~~");
  });
});
