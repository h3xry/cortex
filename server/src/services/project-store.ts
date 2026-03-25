import { readFile, writeFile, mkdir, stat, access } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import type { Project } from "../types.js";

const STORE_DIR = path.join(os.homedir(), ".cortex");
const STORE_FILE = path.join(STORE_DIR, "projects.json");

let projects: Project[] = [];
let loaded = false;

async function ensureStoreDir(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
}

async function loadProjects(): Promise<void> {
  if (loaded) return;
  try {
    await ensureStoreDir();
    const data = await readFile(STORE_FILE, "utf-8");
    projects = JSON.parse(data).map((p: Record<string, unknown>) => {
      const { isPrivate, ...rest } = p; // strip legacy isPrivate field
      return { ...rest, groupId: p.groupId ?? null };
    });
  } catch {
    projects = [];
  }
  loaded = true;
}

async function saveProjects(): Promise<void> {
  await ensureStoreDir();
  await writeFile(STORE_FILE, JSON.stringify(projects, null, 2));
}

export async function listProjects(): Promise<Project[]> {
  await loadProjects();
  return [...projects];
}

export async function getProject(id: string): Promise<Project | undefined> {
  await loadProjects();
  return projects.find((p) => p.id === id);
}

export async function addProject(projectPath: string): Promise<Project> {
  await loadProjects();

  const resolved = path.resolve(projectPath);

  // Validate path exists and is directory
  const stats = await stat(resolved).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error("Path does not exist");
  }

  // Check duplicate
  if (projects.some((p) => p.path === resolved)) {
    throw new Error("Project already added");
  }

  // Check if git repo
  let isGitRepo = false;
  try {
    await access(path.join(resolved, ".git"));
    isGitRepo = true;
  } catch {
    isGitRepo = false;
  }

  const project: Project = {
    id: randomUUID().slice(0, 8),
    name: path.basename(resolved),
    path: resolved,
    isGitRepo,
    addedAt: new Date().toISOString(),
    groupId: null,
  };

  projects.push(project);
  await saveProjects();
  return project;
}

export async function setGroupId(
  id: string,
  groupId: string | null,
): Promise<Project> {
  await loadProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) throw new Error("Project not found");
  project.groupId = groupId;
  await saveProjects();
  return { ...project };
}

export async function unlinkGroup(groupId: string): Promise<void> {
  await loadProjects();
  let changed = false;
  for (const p of projects) {
    if (p.groupId === groupId) {
      p.groupId = null;
      changed = true;
    }
  }
  if (changed) await saveProjects();
}

export async function removeProject(id: string): Promise<void> {
  await loadProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error("Project not found");
  }
  projects.splice(index, 1);
  await saveProjects();
}
