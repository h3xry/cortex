import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import type { Note, NoteMeta } from "../types.js";

const NOTES_DIR = path.join(os.homedir(), ".cc-monitor", "notes");
const ID_RE = /^[a-zA-Z0-9]{1,64}$/;
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

function validateId(id: string, label: string): void {
  if (!ID_RE.test(id)) throw new Error(`Invalid ${label}`);
}

function notesDir(projectId: string): string {
  validateId(projectId, "project ID");
  const dir = path.resolve(path.join(NOTES_DIR, projectId));
  if (!dir.startsWith(path.resolve(NOTES_DIR) + path.sep)) {
    throw new Error("Invalid project ID");
  }
  return dir;
}

function noteFile(projectId: string, noteId: string): string {
  validateId(noteId, "note ID");
  return path.join(notesDir(projectId), `${noteId}.md`);
}

async function ensureDir(projectId: string): Promise<void> {
  await mkdir(notesDir(projectId), { recursive: true });
}

// --- Frontmatter parser/serializer ---

function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return { meta: {}, body: content };

  const meta: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    // Parse inline array: [a, b, c]
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    }
    // Parse booleans
    else if (value === "true") value = true;
    else if (value === "false") value = false;

    meta[key] = value;
  }

  return { meta, body: match[2] };
}

function serializeFrontmatter(note: Note): string {
  const tags = note.tags.length > 0 ? `[${note.tags.join(", ")}]` : "[]";
  const fm = [
    "---",
    `id: ${note.id}`,
    `title: ${note.title}`,
    `tags: ${tags}`,
    `pinned: ${note.pinned}`,
    `createdAt: ${note.createdAt}`,
    `updatedAt: ${note.updatedAt}`,
    "---",
    "",
  ].join("\n");
  return fm + note.content;
}

function makeSnippet(content: string): string {
  // Strip markdown syntax for plain text snippet
  return content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 100);
}

function noteToMeta(note: Note): NoteMeta {
  return {
    id: note.id,
    title: note.title,
    tags: note.tags,
    pinned: note.pinned,
    snippet: makeSnippet(note.content),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function parseNoteFile(content: string): Omit<Note, "id"> {
  const { meta, body } = parseFrontmatter(content);
  return {
    title: (meta.title as string) ?? "Untitled",
    content: body,
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    pinned: meta.pinned === true,
    createdAt: (meta.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (meta.updatedAt as string) ?? new Date().toISOString(),
  };
}

function sortNotes<T extends { pinned: boolean; updatedAt: string }>(notes: T[]): T[] {
  return notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

// --- Public API ---

export async function listNotes(projectId: string): Promise<NoteMeta[]> {
  const dir = notesDir(projectId);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }

  const notes: NoteMeta[] = [];
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const noteId = file.slice(0, -3);
    try {
      const content = await readFile(path.join(dir, file), "utf-8");
      const parsed = parseNoteFile(content);
      notes.push(noteToMeta({ id: noteId, ...parsed }));
    } catch {
      // skip unreadable files
    }
  }

  return sortNotes(notes);
}

export async function getNote(projectId: string, noteId: string): Promise<Note | null> {
  try {
    const content = await readFile(noteFile(projectId, noteId), "utf-8");
    const parsed = parseNoteFile(content);
    return { id: noteId, ...parsed };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function createNote(
  projectId: string,
  data: { title?: string; content?: string; tags?: string[] },
): Promise<Note> {
  await ensureDir(projectId);
  const now = new Date().toISOString();
  const note: Note = {
    id: randomUUID().slice(0, 8),
    title: data.title?.trim() || "Untitled",
    content: data.content ?? "",
    tags: [...new Set((data.tags ?? []).map((t) => t.trim()).filter(Boolean))],
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  await writeFile(noteFile(projectId, note.id), serializeFrontmatter(note));
  return note;
}

export async function updateNote(
  projectId: string,
  noteId: string,
  data: Partial<Pick<Note, "title" | "content" | "tags" | "pinned">>,
): Promise<Note | null> {
  const note = await getNote(projectId, noteId);
  if (!note) return null;

  if (data.title !== undefined) note.title = data.title.trim() || "Untitled";
  if (data.content !== undefined) note.content = data.content;
  if (data.tags !== undefined) note.tags = [...new Set(data.tags.map((t) => t.trim()).filter(Boolean))];
  if (data.pinned !== undefined) note.pinned = data.pinned;
  note.updatedAt = new Date().toISOString();

  await writeFile(noteFile(projectId, noteId), serializeFrontmatter(note));
  return note;
}

export async function deleteNote(projectId: string, noteId: string): Promise<boolean> {
  try {
    await unlink(noteFile(projectId, noteId));
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}
