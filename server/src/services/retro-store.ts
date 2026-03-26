import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Project, RetroEntry, LessonEntry } from "../types.js";
import * as groupStore from "./group-store.js";

const RETRO_DIR = ".claude/memory/retrospective";
const LESSON_DIR = ".claude/memory/lesson";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RETRO_FILE_RE = /^(\d+)-(\d{4})-(.+)\.md$/;

function isPrivateProject(project: Project, groups: { id: string; isPrivate: boolean }[]): boolean {
  if (!project.groupId) return false;
  return groups.some((g) => g.id === project.groupId && g.isPrivate);
}

export async function listRetros(
  projects: Project[],
  unlockToken: string | null,
): Promise<RetroEntry[]> {
  const allGroups = await groupStore.listGroups();
  const retros: RetroEntry[] = [];

  for (const project of projects) {
    if (isPrivateProject(project, allGroups) && !unlockToken) continue;

    const retroPath = path.join(project.path, RETRO_DIR);
    let dateFolders: string[];
    try {
      dateFolders = await readdir(retroPath);
    } catch {
      continue;
    }

    for (const folder of dateFolders) {
      if (!DATE_RE.test(folder)) continue;
      const folderPath = path.join(retroPath, folder);

      let files: string[];
      try {
        files = await readdir(folderPath);
      } catch {
        continue;
      }

      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const match = file.match(RETRO_FILE_RE);
        const order = match ? parseInt(match[1], 10) : 0;
        const title = match
          ? match[3].replace(/-/g, " ")
          : file.slice(0, -3).replace(/-/g, " ");

        try {
          const content = await readFile(path.join(folderPath, file), "utf-8");
          retros.push({
            projectId: project.id,
            projectName: project.name,
            date: folder,
            title,
            order,
            filename: file,
            content,
          });
        } catch {
          // skip unreadable
        }
      }
    }
  }

  return retros.sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    return b.order - a.order;
  });
}

export async function listLessons(
  projects: Project[],
  unlockToken: string | null,
): Promise<LessonEntry[]> {
  const allGroups = await groupStore.listGroups();
  const lessons: LessonEntry[] = [];

  for (const project of projects) {
    if (isPrivateProject(project, allGroups) && !unlockToken) continue;

    const lessonPath = path.join(project.path, LESSON_DIR);
    let files: string[];
    try {
      files = await readdir(lessonPath);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const date = file.slice(0, -3); // remove .md
      if (!DATE_RE.test(date)) continue;

      try {
        const content = await readFile(path.join(lessonPath, file), "utf-8");
        lessons.push({
          projectId: project.id,
          projectName: project.name,
          date,
          filename: file,
          content,
        });
      } catch {
        // skip
      }
    }
  }

  return lessons.sort((a, b) => b.date.localeCompare(a.date));
}
