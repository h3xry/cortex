import { readFile, writeFile, mkdir, readdir, unlink, rename } from "node:fs/promises";
import path from "node:path";
import type { Note, NoteMeta, NoteCategory } from "../types.js";

const VALID_CATEGORIES: Set<string> = new Set(["idea", "meeting", "requirement", "planned", "in-progress", "done", "archived"]);

const NOTES_FOLDER = ".cortex/notes";
const ID_RE = /^[a-zA-Z0-9]{1,64}$/;
const SEQ_RE = /^(\d{3,})-/;
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

function notesDir(projectPath: string): string {
  return path.join(projectPath, NOTES_FOLDER);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "untitled";
}

function makeFilename(id: string, title: string): string {
  return `${id}-${slugify(title)}.md`;
}

async function findFile(projectPath: string, noteId: string): Promise<string | null> {
  const dir = notesDir(projectPath);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return null;
  }
  // Exact match first (backward compat with old format like "abc12345.md")
  if (files.includes(`${noteId}.md`)) {
    return path.join(dir, `${noteId}.md`);
  }
  // Match by ID prefix (e.g. "001" matches "001-meeting-note.md")
  for (const f of files) {
    if (f.startsWith(`${noteId}-`) && f.endsWith(".md")) {
      return path.join(dir, f);
    }
  }
  return null;
}

function noteIdValidate(noteId: string): void {
  if (!ID_RE.test(noteId)) throw new Error("Invalid note ID");
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
    `category: ${note.category}`,
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
    category: note.category,
    pinned: note.pinned,
    snippet: makeSnippet(note.content),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function extractId(filename: string): string {
  const name = filename.slice(0, -3); // remove .md
  const match = name.match(SEQ_RE);
  return match ? match[1] : name;
}

function parseNoteFile(content: string): Omit<Note, "id"> {
  const { meta, body } = parseFrontmatter(content);
  const rawCategory = (meta.category as string) ?? "idea";
  const category = VALID_CATEGORIES.has(rawCategory) ? (rawCategory as NoteCategory) : "idea";
  return {
    title: (meta.title as string) ?? "Untitled",
    content: body,
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    category,
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
    const noteId = extractId(file);
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
  noteIdValidate(noteId);
  const filePath = await findFile(projectPath, noteId);
  if (!filePath) return null;
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = parseNoteFile(content);
    return { id: noteId, ...parsed };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function nextId(projectPath: string): Promise<string> {
  const dir = notesDir(projectPath);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return "001";
  }
  let max = 0;
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const num = parseInt(extractId(f), 10);
    if (!isNaN(num) && num > max) max = num;
  }
  return String(max + 1).padStart(3, "0");
}

export async function createNote(
  projectPath: string,
  data: { title?: string; content?: string; tags?: string[]; category?: NoteCategory },
): Promise<Note> {
  await ensureDir(projectPath);
  const now = new Date().toISOString();
  const category = data.category && VALID_CATEGORIES.has(data.category) ? data.category : "idea";
  const note: Note = {
    id: await nextId(projectPath),
    title: data.title?.trim() || "Untitled",
    content: data.content ?? "",
    tags: [...new Set((data.tags ?? []).map((t) => t.trim()).filter(Boolean))],
    category,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  const filename = makeFilename(note.id, note.title);
  await writeFile(path.join(notesDir(projectPath), filename), serializeFrontmatter(note));
  return note;
}

export async function updateNote(
  projectPath: string,
  noteId: string,
  data: Partial<Pick<Note, "title" | "content" | "tags" | "category" | "pinned">>,
): Promise<Note | null> {
  noteIdValidate(noteId);
  const oldPath = await findFile(projectPath, noteId);
  if (!oldPath) return null;

  const content = await readFile(oldPath, "utf-8");
  const parsed = parseNoteFile(content);
  const note: Note = { id: noteId, ...parsed };

  if (data.title !== undefined) note.title = data.title.trim() || "Untitled";
  if (data.content !== undefined) note.content = data.content;
  if (data.tags !== undefined) note.tags = [...new Set(data.tags.map((t) => t.trim()).filter(Boolean))];
  if (data.category !== undefined && VALID_CATEGORIES.has(data.category)) note.category = data.category;
  if (data.pinned !== undefined) note.pinned = data.pinned;
  note.updatedAt = new Date().toISOString();

  const newFilename = makeFilename(noteId, note.title);
  const newPath = path.join(notesDir(projectPath), newFilename);

  if (oldPath !== newPath) {
    await unlink(oldPath);
  }
  await writeFile(newPath, serializeFrontmatter(note));
  return note;
}

export async function deleteNote(projectPath: string, noteId: string): Promise<boolean> {
  noteIdValidate(noteId);
  const filePath = await findFile(projectPath, noteId);
  if (!filePath) return false;
  try {
    await unlink(filePath);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}
