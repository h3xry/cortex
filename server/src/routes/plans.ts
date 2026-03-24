import { Router } from "express";
import * as projectStore from "../services/project-store.js";
import * as planStore from "../services/plan-store.js";
import type { TaskStatus } from "../types.js";

export const planRouter = Router({ mergeParams: true });

const VALID_STATUSES: TaskStatus[] = ["Backlog", "Sprint", "InProgress", "Review", "Done"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TITLE_LEN = 500;

function validateTitle(title: unknown): string | null {
  if (!title || typeof title !== "string") return "title is required";
  if (title.length > MAX_TITLE_LEN) return `title must be <= ${MAX_TITLE_LEN} characters`;
  if (/[\r\n]/.test(title)) return "title must not contain newlines";
  return null;
}

function validateDate(value: unknown, field: string): string | null {
  if (!value || typeof value !== "string") return `${field} is required`;
  if (!DATE_RE.test(value)) return `${field} must be YYYY-MM-DD`;
  return null;
}

type Params = { id: string; taskId?: string; milestoneId?: string; sprintId?: string };

async function resolveProject(id: string, res: import("express").Response): Promise<boolean> {
  const project = await projectStore.getProject(id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return false;
  }
  return true;
}

// GET /api/projects/:id/plan
planRouter.get("/", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;

    const plan = await planStore.getPlan(((req.params as Params).id));

    // Compute milestone fields
    const today = new Date().toISOString().slice(0, 10);
    const milestones = plan.milestones.map((ms) => {
      const linkedTasks = plan.tasks.filter((t) =>
        ms.taskRefs.some((ref) => t.title === ref),
      );
      const doneCount = linkedTasks.filter((t) => t.done).length;
      const total = linkedTasks.length;
      const progress = total > 0 ? doneCount / total : 0;
      const daysUntil = Math.ceil(
        (new Date(ms.deadline).getTime() - new Date(today).getTime()) / 86400000,
      );
      return {
        ...ms,
        progress,
        isOverdue: ms.deadline < today && progress < 1,
        isUrgent: daysUntil <= 3 && daysUntil >= 0 && progress < 1,
      };
    });

    // Compute sprint fields
    const sprints = plan.sprints.map((sp) => {
      const isActive = sp.startDate <= today && today <= sp.endDate;
      const isPast = sp.endDate < today;
      const linkedTasks = plan.tasks.filter((t) =>
        sp.taskRefs.some((ref) => t.title === ref),
      );
      const doneCount = linkedTasks.filter((t) => t.done).length;
      const remainingDays = isActive
        ? Math.ceil((new Date(sp.endDate).getTime() - new Date(today).getTime()) / 86400000)
        : null;
      return {
        ...sp,
        isActive,
        velocity: isPast ? doneCount : null,
        remainingDays,
      };
    });

    res.json({ tasks: plan.tasks, milestones, sprints });
  } catch (err) {
    console.error("Plan get error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/projects/:id/plan/raw
planRouter.get("/raw", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const content = await planStore.getRawPlan(((req.params as Params).id));
    res.json({ content });
  } catch (err) {
    console.error("Plan raw get error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/projects/:id/plan/raw
planRouter.put("/raw", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const { content } = req.body;
    if (typeof content !== "string") {
      res.status(400).json({ error: "content (string) is required" });
      return;
    }
    await planStore.saveRawPlan(((req.params as Params).id), content);
    res.json({ ok: true });
  } catch (err) {
    console.error("Plan raw put error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/projects/:id/plan/tasks
planRouter.post("/tasks", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const { title, tags, status, effort, subTasks } = req.body;

    const titleErr = validateTitle(title);
    if (titleErr) {
      res.status(400).json({ error: titleErr });
      return;
    }
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
      return;
    }

    const task = await planStore.addTask(((req.params as Params).id), { title, tags, status, effort, subTasks });
    res.status(201).json(task);
  } catch (err) {
    console.error("Plan add task error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/projects/:id/plan/tasks/:taskId
planRouter.patch("/tasks/:taskId", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const { title, tags, status, effort, done, subTasks, milestoneId, sprintId } = req.body;
    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `Invalid status` });
      return;
    }

    const task = await planStore.updateTask(((req.params as Params).id), ((req.params as Params).taskId!), { title, tags, status, effort, done, subTasks, milestoneId, sprintId });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (err) {
    console.error("Plan update task error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/projects/:id/plan/tasks/:taskId
planRouter.delete("/tasks/:taskId", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const deleted = await planStore.deleteTask(((req.params as Params).id), ((req.params as Params).taskId!));
    if (!deleted) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json({ id: ((req.params as Params).taskId!) });
  } catch (err) {
    console.error("Plan delete task error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/projects/:id/plan/milestones
planRouter.post("/milestones", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const { title, deadline, taskRefs } = req.body;
    const msTitleErr = validateTitle(title);
    if (msTitleErr) { res.status(400).json({ error: msTitleErr }); return; }
    const msDateErr = validateDate(deadline, "deadline");
    if (msDateErr) { res.status(400).json({ error: msDateErr }); return; }
    const ms = await planStore.addMilestone(((req.params as Params).id), { title, deadline, taskRefs });
    res.status(201).json(ms);
  } catch (err) {
    console.error("Plan add milestone error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/projects/:id/plan/milestones/:milestoneId
planRouter.patch("/milestones/:milestoneId", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const { title, deadline, taskRefs } = req.body;
    const ms = await planStore.updateMilestone(((req.params as Params).id), ((req.params as Params).milestoneId!), { title, deadline, taskRefs });
    if (!ms) {
      res.status(404).json({ error: "Milestone not found" });
      return;
    }
    res.json(ms);
  } catch (err) {
    console.error("Plan update milestone error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/projects/:id/plan/milestones/:milestoneId
planRouter.delete("/milestones/:milestoneId", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const deleted = await planStore.deleteMilestone(((req.params as Params).id), ((req.params as Params).milestoneId!));
    if (!deleted) {
      res.status(404).json({ error: "Milestone not found" });
      return;
    }
    res.json({ id: ((req.params as Params).milestoneId!) });
  } catch (err) {
    console.error("Plan delete milestone error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/projects/:id/plan/sprints
planRouter.post("/sprints", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const { title, startDate, endDate, taskRefs } = req.body;
    const spTitleErr = validateTitle(title);
    if (spTitleErr) { res.status(400).json({ error: spTitleErr }); return; }
    const startErr = validateDate(startDate, "startDate");
    if (startErr) { res.status(400).json({ error: startErr }); return; }
    const endErr = validateDate(endDate, "endDate");
    if (endErr) { res.status(400).json({ error: endErr }); return; }
    const sp = await planStore.addSprint(((req.params as Params).id), { title, startDate, endDate, taskRefs });
    res.status(201).json(sp);
  } catch (err) {
    console.error("Plan add sprint error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/projects/:id/plan/sprints/:sprintId
planRouter.patch("/sprints/:sprintId", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const { title: spTitle, startDate, endDate, taskRefs: spTaskRefs } = req.body;
    const sp = await planStore.updateSprint(((req.params as Params).id), ((req.params as Params).sprintId!), { title: spTitle, startDate, endDate, taskRefs: spTaskRefs });
    if (!sp) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }
    res.json(sp);
  } catch (err) {
    console.error("Plan update sprint error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/projects/:id/plan/sprints/:sprintId
planRouter.delete("/sprints/:sprintId", async (req, res) => {
  try {
    if (!(await resolveProject(((req.params as Params).id), res))) return;
    const deleted = await planStore.deleteSprint(((req.params as Params).id), ((req.params as Params).sprintId!));
    if (!deleted) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }
    res.json({ id: ((req.params as Params).sprintId!) });
  } catch (err) {
    console.error("Plan delete sprint error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
