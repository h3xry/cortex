import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Note, NoteMeta } from "../types.js";

const NOTES_FOLDER = ".cc-monitor/notes";
const ID_RE = /^[a-zA-Z0-9]{1,64}$/;
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

function notesDir(projectPath: string): string {
  return path.join(projectPath, NOTES_FOLDER);
}

function noteFile(projectPath: string, noteId: string): string {
  if (!ID_RE.test(noteId)) throw new Error("Invalid note ID");
  return path.join(notesDir(projectPath), `${noteId}.md`);
}

async function ensureDir(projectPath: string): Promise<void> {
  await mkdir(notesDir(projectPath), { recursive: true });
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

export async function listNotes(projectPath: string): Promise<NoteMeta[]> {
  const dir = notesDir(projectPath);
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

export async function getNote(projectPath: string, noteId: string): Promise<Note | null> {
  try {
    const content = await readFile(noteFile(projectPath, noteId), "utf-8");
    const parsed = parseNoteFile(content);
    return { id: noteId, ...parsed };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function createNote(
  projectPath: string,
  data: { title?: string; content?: string; tags?: string[] },
): Promise<Note> {
  await ensureDir(projectPath);
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
  await writeFile(noteFile(projectPath, note.id), serializeFrontmatter(note));
  return note;
}

export async function updateNote(
  projectPath: string,
  noteId: string,
  data: Partial<Pick<Note, "title" | "content" | "tags" | "pinned">>,
): Promise<Note | null> {
  const note = await getNote(projectPath, noteId);
  if (!note) return null;

  if (data.title !== undefined) note.title = data.title.trim() || "Untitled";
  if (data.content !== undefined) note.content = data.content;
  if (data.tags !== undefined) note.tags = [...new Set(data.tags.map((t) => t.trim()).filter(Boolean))];
  if (data.pinned !== undefined) note.pinned = data.pinned;
  note.updatedAt = new Date().toISOString();

  await writeFile(noteFile(projectPath, noteId), serializeFrontmatter(note));
  return note;
}

export async function deleteNote(projectPath: string, noteId: string): Promise<boolean> {
  try {
    await unlink(noteFile(projectPath, noteId));
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}
