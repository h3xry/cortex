import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

let tmpDir: string;

vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return { ...actual, default: { ...actual.default, homedir: () => tmpDir } };
});

describe("note-store", () => {
  let store: typeof import("../src/services/note-store.js");

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "note-store-test-"));
    vi.resetModules();
    store = await import("../src/services/note-store.js");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("listNotes returns empty array when no notes", async () => {
    const notes = await store.listNotes("proj1");
    expect(notes).toEqual([]);
  });

  it("createNote creates .md file with frontmatter", async () => {
    const note = await store.createNote("proj1", {
      title: "Test Note",
      content: "# Hello\n\nWorld",
      tags: ["tag1", "tag2"],
    });

    expect(note.id).toMatch(/^[a-f0-9]{8}$/);
    expect(note.title).toBe("Test Note");
    expect(note.tags).toEqual(["tag1", "tag2"]);
    expect(note.pinned).toBe(false);

    const filePath = path.join(tmpDir, ".cc-monitor", "notes", "proj1", `${note.id}.md`);
    const content = await readFile(filePath, "utf-8");
    expect(content).toContain("---");
    expect(content).toContain("title: Test Note");
    expect(content).toContain("tags: [tag1, tag2]");
    expect(content).toContain("# Hello\n\nWorld");
  });

  it("createNote defaults title to Untitled", async () => {
    const note = await store.createNote("proj1", {});
    expect(note.title).toBe("Untitled");
  });

  it("createNote deduplicates tags", async () => {
    const note = await store.createNote("proj1", { tags: ["a", "b", "a", " b "] });
    expect(note.tags).toEqual(["a", "b"]);
  });

  it("getNote returns note with content", async () => {
    const created = await store.createNote("proj1", {
      title: "Get Test",
      content: "Some content",
    });
    const note = await store.getNote("proj1", created.id);
    expect(note).not.toBeNull();
    expect(note!.title).toBe("Get Test");
    expect(note!.content).toBe("Some content");
  });

  it("getNote returns null for unknown note", async () => {
    const note = await store.getNote("proj1", "nonexist");
    expect(note).toBeNull();
  });

  it("listNotes returns metadata with snippets", async () => {
    await store.createNote("proj1", { title: "Note 1", content: "First note content here" });
    await store.createNote("proj1", { title: "Note 2", content: "Second note" });
    const notes = await store.listNotes("proj1");
    expect(notes).toHaveLength(2);
    expect(notes[0].snippet).toBeDefined();
    expect(typeof notes[0].snippet).toBe("string");
    // No content field in metadata
    expect((notes[0] as Record<string, unknown>).content).toBeUndefined();
  });

  it("listNotes sorts pinned first then by updatedAt desc", async () => {
    const n1 = await store.createNote("proj1", { title: "Old" });
    const n2 = await store.createNote("proj1", { title: "New" });
    await store.updateNote("proj1", n1.id, { pinned: true });

    const notes = await store.listNotes("proj1");
    expect(notes[0].id).toBe(n1.id); // pinned first
    expect(notes[0].pinned).toBe(true);
  });

  it("updateNote changes fields", async () => {
    const created = await store.createNote("proj1", { title: "Original" });
    const updated = await store.updateNote("proj1", created.id, {
      title: "Updated",
      pinned: true,
      tags: ["new-tag"],
    });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("Updated");
    expect(updated!.pinned).toBe(true);
    expect(updated!.tags).toEqual(["new-tag"]);
  });

  it("updateNote returns null for unknown note", async () => {
    const result = await store.updateNote("proj1", "nope", { title: "x" });
    expect(result).toBeNull();
  });

  it("deleteNote removes file", async () => {
    const note = await store.createNote("proj1", { title: "Delete me" });
    const deleted = await store.deleteNote("proj1", note.id);
    expect(deleted).toBe(true);
    const check = await store.getNote("proj1", note.id);
    expect(check).toBeNull();
  });

  it("deleteNote returns false for unknown note", async () => {
    expect(await store.deleteNote("proj1", "nope")).toBe(false);
  });

  it("rejects invalid projectId with path traversal", async () => {
    await expect(store.listNotes("../../etc")).rejects.toThrow("Invalid project ID");
    await expect(store.createNote("../evil", { title: "x" })).rejects.toThrow("Invalid project ID");
  });

  it("rejects invalid noteId", async () => {
    await expect(store.getNote("proj1", "../../etc/passwd")).rejects.toThrow("Invalid note ID");
  });

  it("frontmatter roundtrip preserves all fields", async () => {
    const created = await store.createNote("proj1", {
      title: "Roundtrip",
      content: "# Test\n\n- item 1\n- item 2",
      tags: ["a", "b"],
    });
    await store.updateNote("proj1", created.id, { pinned: true });

    const note = await store.getNote("proj1", created.id);
    expect(note!.title).toBe("Roundtrip");
    expect(note!.content).toBe("# Test\n\n- item 1\n- item 2");
    expect(note!.tags).toEqual(["a", "b"]);
    expect(note!.pinned).toBe(true);
  });
});
