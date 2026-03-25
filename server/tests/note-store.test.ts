import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

let projectPath: string;

describe("note-store", () => {
  let store: typeof import("../src/services/note-store.js");

  beforeEach(async () => {
    projectPath = await mkdtemp(path.join(os.tmpdir(), "note-store-test-"));
    store = await import("../src/services/note-store.js");
  });

  afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true });
  });

  it("listNotes returns empty array when no notes", async () => {
    const notes = await store.listNotes(projectPath);
    expect(notes).toEqual([]);
  });

  it("createNote creates .md file with id-title filename", async () => {
    const note = await store.createNote(projectPath, {
      title: "Test Note",
      content: "# Hello\n\nWorld",
      tags: ["tag1", "tag2"],
    });

    expect(note.id).toMatch(/^[0-9]{3,}$/);
    expect(note.title).toBe("Test Note");
    expect(note.tags).toEqual(["tag1", "tag2"]);
    expect(note.pinned).toBe(false);

    const filePath = path.join(projectPath, ".cortex", "notes", "001-test-note.md");
    const content = await readFile(filePath, "utf-8");
    expect(content).toContain("---");
    expect(content).toContain("title: Test Note");
    expect(content).toContain("tags: [tag1, tag2]");
    expect(content).toContain("# Hello\n\nWorld");
  });

  it("createNote defaults title to Untitled", async () => {
    const note = await store.createNote(projectPath, {});
    expect(note.title).toBe("Untitled");

    const files = await readdir(path.join(projectPath, ".cortex", "notes"));
    expect(files[0]).toBe("001-untitled.md");
  });

  it("createNote deduplicates tags", async () => {
    const note = await store.createNote(projectPath, { tags: ["a", "b", "a", " b "] });
    expect(note.tags).toEqual(["a", "b"]);
  });

  it("getNote returns note with content", async () => {
    const created = await store.createNote(projectPath, {
      title: "Get Test",
      content: "Some content",
    });
    const note = await store.getNote(projectPath, created.id);
    expect(note).not.toBeNull();
    expect(note!.title).toBe("Get Test");
    expect(note!.content).toBe("Some content");
  });

  it("getNote returns null for unknown note", async () => {
    const note = await store.getNote(projectPath, "999");
    expect(note).toBeNull();
  });

  it("listNotes returns metadata with snippets", async () => {
    await store.createNote(projectPath, { title: "Note 1", content: "First note content here" });
    await store.createNote(projectPath, { title: "Note 2", content: "Second note" });
    const notes = await store.listNotes(projectPath);
    expect(notes).toHaveLength(2);
    expect(notes[0].snippet).toBeDefined();
    expect(typeof notes[0].snippet).toBe("string");
    expect((notes[0] as Record<string, unknown>).content).toBeUndefined();
  });

  it("listNotes sorts pinned first then by updatedAt desc", async () => {
    const n1 = await store.createNote(projectPath, { title: "Old" });
    const n2 = await store.createNote(projectPath, { title: "New" });
    await store.updateNote(projectPath, n1.id, { pinned: true });

    const notes = await store.listNotes(projectPath);
    expect(notes[0].id).toBe(n1.id);
    expect(notes[0].pinned).toBe(true);
  });

  it("createNote generates sequential IDs", async () => {
    const n1 = await store.createNote(projectPath, { title: "First" });
    const n2 = await store.createNote(projectPath, { title: "Second" });
    const n3 = await store.createNote(projectPath, { title: "Third" });
    expect(n1.id).toBe("001");
    expect(n2.id).toBe("002");
    expect(n3.id).toBe("003");
  });

  it("createNote reuses deleted ID slot", async () => {
    await store.createNote(projectPath, { title: "One" });
    const n2 = await store.createNote(projectPath, { title: "Two" });
    await store.deleteNote(projectPath, n2.id);
    const n3 = await store.createNote(projectPath, { title: "Three" });
    expect(n3.id).toBe("002");
  });

  it("updateNote changes fields", async () => {
    const created = await store.createNote(projectPath, { title: "Original" });
    const updated = await store.updateNote(projectPath, created.id, {
      title: "Updated",
      pinned: true,
      tags: ["new-tag"],
    });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("Updated");
    expect(updated!.pinned).toBe(true);
    expect(updated!.tags).toEqual(["new-tag"]);
  });

  it("updateNote renames file when title changes", async () => {
    const created = await store.createNote(projectPath, { title: "Old Title" });
    await store.updateNote(projectPath, created.id, { title: "New Title" });

    const files = await readdir(path.join(projectPath, ".cortex", "notes"));
    expect(files).toContain("001-new-title.md");
    expect(files).not.toContain("001-old-title.md");
  });

  it("updateNote returns null for unknown note", async () => {
    const result = await store.updateNote(projectPath, "999", { title: "x" });
    expect(result).toBeNull();
  });

  it("deleteNote removes file", async () => {
    const note = await store.createNote(projectPath, { title: "Delete me" });
    const deleted = await store.deleteNote(projectPath, note.id);
    expect(deleted).toBe(true);
    const check = await store.getNote(projectPath, note.id);
    expect(check).toBeNull();
  });

  it("deleteNote returns false for unknown note", async () => {
    expect(await store.deleteNote(projectPath, "999")).toBe(false);
  });

  it("rejects invalid noteId", async () => {
    await expect(store.getNote(projectPath, "../../etc/passwd")).rejects.toThrow("Invalid note ID");
  });

  it("frontmatter roundtrip preserves all fields", async () => {
    const created = await store.createNote(projectPath, {
      title: "Roundtrip",
      content: "# Test\n\n- item 1\n- item 2",
      tags: ["a", "b"],
    });
    await store.updateNote(projectPath, created.id, { pinned: true });

    const note = await store.getNote(projectPath, created.id);
    expect(note!.title).toBe("Roundtrip");
    expect(note!.content).toBe("# Test\n\n- item 1\n- item 2");
    expect(note!.tags).toEqual(["a", "b"]);
    expect(note!.pinned).toBe(true);
  });
});
