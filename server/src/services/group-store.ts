import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import type { Group } from "../types.js";

const STORE_DIR = path.join(os.homedir(), ".cc-monitor");
const STORE_FILE = path.join(STORE_DIR, "groups.json");

let groups: Group[] = [];
let loaded = false;

async function ensureStoreDir(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
}

async function loadGroups(): Promise<void> {
  if (loaded) return;
  try {
    await ensureStoreDir();
    const data = await readFile(STORE_FILE, "utf-8");
    groups = JSON.parse(data).map((g: Record<string, unknown>) => ({
      ...g,
      isPrivate: g.isPrivate ?? false,
    }));
  } catch {
    groups = [];
  }
  loaded = true;
}

async function saveGroups(): Promise<void> {
  await ensureStoreDir();
  await writeFile(STORE_FILE, JSON.stringify(groups, null, 2));
}

export async function listGroups(): Promise<Group[]> {
  await loadGroups();
  return [...groups].sort((a, b) => a.order - b.order);
}

export async function getGroup(id: string): Promise<Group | undefined> {
  await loadGroups();
  return groups.find((g) => g.id === id);
}

export async function createGroup(data: {
  name: string;
  icon: string;
  color: string;
  isPrivate?: boolean;
}): Promise<Group> {
  await loadGroups();
  const group: Group = {
    id: randomUUID().slice(0, 8),
    name: data.name,
    icon: data.icon,
    color: data.color,
    order: groups.length,
    isPrivate: data.isPrivate ?? false,
    createdAt: new Date().toISOString(),
  };
  groups.push(group);
  await saveGroups();
  return group;
}

export async function updateGroup(
  id: string,
  data: Partial<Pick<Group, "name" | "icon" | "color" | "isPrivate">>,
): Promise<Group | null> {
  await loadGroups();
  const group = groups.find((g) => g.id === id);
  if (!group) return null;
  if (data.name !== undefined) group.name = data.name;
  if (data.icon !== undefined) group.icon = data.icon;
  if (data.color !== undefined) group.color = data.color;
  if (data.isPrivate !== undefined) group.isPrivate = data.isPrivate;
  await saveGroups();
  return { ...group };
}

export async function deleteGroup(id: string): Promise<boolean> {
  await loadGroups();
  const idx = groups.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  groups.splice(idx, 1);
  // Re-index order
  groups.forEach((g, i) => { g.order = i; });
  await saveGroups();
  return true;
}

export async function reorderGroups(ids: string[]): Promise<boolean> {
  await loadGroups();
  const reordered: Group[] = [];
  for (const id of ids) {
    const g = groups.find((gr) => gr.id === id);
    if (!g) return false;
    reordered.push(g);
  }
  // Include any groups not in the ids list at the end
  for (const g of groups) {
    if (!ids.includes(g.id)) reordered.push(g);
  }
  reordered.forEach((g, i) => { g.order = i; });
  groups = reordered;
  await saveGroups();
  return true;
}

export async function getPrivateGroupIds(): Promise<Set<string>> {
  await loadGroups();
  return new Set(groups.filter((g) => g.isPrivate).map((g) => g.id));
}

// For testing
export function _resetForTest(): void {
  groups = [];
  loaded = false;
}
