import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { Plan, PlanTask, Milestone, Sprint, TaskStatus } from "../types.js";
import { parsePlanMd, serializePlan } from "./plan-parser.js";

const PLANS_DIR = path.join(os.homedir(), ".cc-monitor", "plans");

function planDir(projectId: string): string {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(projectId)) {
    throw new Error("Invalid project ID");
  }
  const dir = path.resolve(path.join(PLANS_DIR, projectId));
  if (!dir.startsWith(path.resolve(PLANS_DIR) + path.sep)) {
    throw new Error("Invalid project ID");
  }
  return dir;
}

function planFile(projectId: string): string {
  return path.join(planDir(projectId), "plan.md");
}

async function ensureDir(projectId: string): Promise<void> {
  await mkdir(planDir(projectId), { recursive: true });
}

export async function getPlan(projectId: string): Promise<Plan> {
  const file = planFile(projectId); // validates projectId
  try {
    const content = await readFile(file, "utf-8");
    return parsePlanMd(content);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { tasks: [], milestones: [], sprints: [] };
    }
    throw err;
  }
}

export async function savePlan(projectId: string, plan: Plan): Promise<void> {
  await ensureDir(projectId);
  await writeFile(planFile(projectId), serializePlan(plan));
}

export async function getRawPlan(projectId: string): Promise<string> {
  const file = planFile(projectId);
  try {
    return await readFile(file, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw err;
  }
}

export async function saveRawPlan(projectId: string, content: string): Promise<void> {
  await ensureDir(projectId);
  await writeFile(planFile(projectId), content);
}

function nextId(prefix: string, existing: { id: string }[]): string {
  let max = 0;
  for (const item of existing) {
    const match = item.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export async function addTask(
  projectId: string,
  data: { title: string; tags?: string[]; status?: TaskStatus; effort?: string; subTasks?: { title: string; done: boolean; effort?: string | null }[] },
): Promise<PlanTask> {
  const plan = await getPlan(projectId);
  const now = new Date().toISOString();
  const task: PlanTask = {
    id: nextId("TASK", plan.tasks),
    title: data.title,
    description: null,
    tags: data.tags ?? [],
    status: data.status ?? "Backlog",
    subTasks: (data.subTasks ?? []).map((s) => ({ title: s.title, done: s.done, effort: s.effort ?? null })),
    effort: data.effort ?? null,
    milestoneId: null,
    sprintId: null,
    done: false,
    createdAt: now,
    updatedAt: now,
  };
  plan.tasks.push(task);
  await savePlan(projectId, plan);
  return task;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  data: Partial<Pick<PlanTask, "title" | "tags" | "status" | "effort" | "done" | "subTasks" | "milestoneId" | "sprintId">>,
): Promise<PlanTask | null> {
  const plan = await getPlan(projectId);
  const task = plan.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  if (data.title !== undefined) task.title = data.title;
  if (data.tags !== undefined) task.tags = data.tags;
  if (data.status !== undefined) task.status = data.status;
  if (data.effort !== undefined) task.effort = data.effort;
  if (data.done !== undefined) task.done = data.done;
  if (data.subTasks !== undefined) task.subTasks = data.subTasks;
  if (data.milestoneId !== undefined) task.milestoneId = data.milestoneId;
  if (data.sprintId !== undefined) task.sprintId = data.sprintId;
  task.updatedAt = new Date().toISOString();

  await savePlan(projectId, plan);
  return task;
}

export async function deleteTask(projectId: string, taskId: string): Promise<boolean> {
  const plan = await getPlan(projectId);
  const idx = plan.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return false;
  plan.tasks.splice(idx, 1);
  await savePlan(projectId, plan);
  return true;
}

export async function addMilestone(
  projectId: string,
  data: { title: string; deadline: string; taskRefs?: string[] },
): Promise<Milestone> {
  const plan = await getPlan(projectId);
  const ms: Milestone = {
    id: nextId("MS", plan.milestones),
    title: data.title,
    deadline: data.deadline,
    taskRefs: data.taskRefs ?? [],
  };
  plan.milestones.push(ms);
  await savePlan(projectId, plan);
  return ms;
}

export async function updateMilestone(
  projectId: string,
  msId: string,
  data: Partial<Pick<Milestone, "title" | "deadline" | "taskRefs">>,
): Promise<Milestone | null> {
  const plan = await getPlan(projectId);
  const ms = plan.milestones.find((m) => m.id === msId);
  if (!ms) return null;
  if (data.title !== undefined) ms.title = data.title;
  if (data.deadline !== undefined) ms.deadline = data.deadline;
  if (data.taskRefs !== undefined) ms.taskRefs = data.taskRefs;
  await savePlan(projectId, plan);
  return ms;
}

export async function deleteMilestone(projectId: string, msId: string): Promise<boolean> {
  const plan = await getPlan(projectId);
  const idx = plan.milestones.findIndex((m) => m.id === msId);
  if (idx === -1) return false;
  plan.milestones.splice(idx, 1);
  await savePlan(projectId, plan);
  return true;
}

export async function addSprint(
  projectId: string,
  data: { title: string; startDate: string; endDate: string; taskRefs?: string[] },
): Promise<Sprint> {
  const plan = await getPlan(projectId);
  const sp: Sprint = {
    id: nextId("SP", plan.sprints),
    title: data.title,
    startDate: data.startDate,
    endDate: data.endDate,
    taskRefs: data.taskRefs ?? [],
  };
  plan.sprints.push(sp);
  await savePlan(projectId, plan);
  return sp;
}

export async function updateSprint(
  projectId: string,
  spId: string,
  data: Partial<Pick<Sprint, "title" | "startDate" | "endDate" | "taskRefs">>,
): Promise<Sprint | null> {
  const plan = await getPlan(projectId);
  const sp = plan.sprints.find((s) => s.id === spId);
  if (!sp) return null;
  if (data.title !== undefined) sp.title = data.title;
  if (data.startDate !== undefined) sp.startDate = data.startDate;
  if (data.endDate !== undefined) sp.endDate = data.endDate;
  if (data.taskRefs !== undefined) sp.taskRefs = data.taskRefs;
  await savePlan(projectId, plan);
  return sp;
}

export async function deleteSprint(projectId: string, spId: string): Promise<boolean> {
  const plan = await getPlan(projectId);
  const idx = plan.sprints.findIndex((s) => s.id === spId);
  if (idx === -1) return false;
  plan.sprints.splice(idx, 1);
  await savePlan(projectId, plan);
  return true;
}
