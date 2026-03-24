import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { noteRouter } from "../src/routes/notes.js";

vi.mock("../src/services/project-store.js", () => ({
  getProject: vi.fn(),
}));

vi.mock("../src/services/note-store.js", () => ({
  listNotes: vi.fn(),
  getNote: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

vi.mock("../src/services/unlock-store.js", () => ({
  isUnlockedHeader: vi.fn().mockReturnValue(true),
}));

import * as projectStore from "../src/services/project-store.js";
import * as noteStore from "../src/services/note-store.js";
import * as unlockStore from "../src/services/unlock-store.js";

const mockGetProject = vi.mocked(projectStore.getProject);
const mockListNotes = vi.mocked(noteStore.listNotes);
const mockGetNote = vi.mocked(noteStore.getNote);
const mockCreateNote = vi.mocked(noteStore.createNote);
const mockUpdateNote = vi.mocked(noteStore.updateNote);
const mockDeleteNote = vi.mocked(noteStore.deleteNote);
const mockIsUnlocked = vi.mocked(unlockStore.isUnlockedHeader);

const PROJECT = { id: "proj1", name: "test", path: "/tmp/test", isGitRepo: false, addedAt: "2026-01-01", isPrivate: false };
const PRIVATE_PROJECT = { ...PROJECT, id: "priv1", isPrivate: true };

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/projects/:id/notes", noteRouter);
  return app;
}

describe("GET /api/projects/:id/notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns note list", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockListNotes.mockResolvedValue([
      { id: "abc", title: "Test", tags: [], pinned: false, snippet: "content", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    ]);
    const res = await request(createApp()).get("/api/projects/proj1/notes");
    expect(res.status).toBe(200);
    expect(res.body.notes).toHaveLength(1);
  });

  it("returns 404 for unknown project", async () => {
    mockGetProject.mockResolvedValue(undefined);
    const res = await request(createApp()).get("/api/projects/nope/notes");
    expect(res.status).toBe(404);
  });

  it("returns 403 for private project without token", async () => {
    mockGetProject.mockResolvedValue(PRIVATE_PROJECT);
    mockIsUnlocked.mockReturnValue(false);
    const res = await request(createApp()).get("/api/projects/priv1/notes");
    expect(res.status).toBe(403);
  });
});

describe("GET /api/projects/:id/notes/:noteId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns note with content", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockGetNote.mockResolvedValue({
      id: "abc", title: "Test", content: "# Hello", tags: [], pinned: false,
      createdAt: "2026-01-01", updatedAt: "2026-01-01",
    });
    const res = await request(createApp()).get("/api/projects/proj1/notes/abc");
    expect(res.status).toBe(200);
    expect(res.body.content).toBe("# Hello");
  });

  it("returns 404 for unknown note", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockGetNote.mockResolvedValue(null);
    const res = await request(createApp()).get("/api/projects/proj1/notes/nope");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/projects/:id/notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates note", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockCreateNote.mockResolvedValue({
      id: "abc", title: "New", content: "", tags: [], pinned: false,
      createdAt: "2026-01-01", updatedAt: "2026-01-01",
    });
    const res = await request(createApp())
      .post("/api/projects/proj1/notes")
      .send({ title: "New" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("abc");
  });

  it("rejects title with newlines", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    const res = await request(createApp())
      .post("/api/projects/proj1/notes")
      .send({ title: "bad\ntitle" });
    expect(res.status).toBe(400);
  });

  it("rejects non-array tags", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    const res = await request(createApp())
      .post("/api/projects/proj1/notes")
      .send({ title: "test", tags: "not-array" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/projects/:id/notes/:noteId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates note", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockUpdateNote.mockResolvedValue({
      id: "abc", title: "Updated", content: "new", tags: [], pinned: true,
      createdAt: "2026-01-01", updatedAt: "2026-01-01",
    });
    const res = await request(createApp())
      .patch("/api/projects/proj1/notes/abc")
      .send({ title: "Updated", pinned: true });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
  });

  it("returns 404 for unknown note", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockUpdateNote.mockResolvedValue(null);
    const res = await request(createApp())
      .patch("/api/projects/proj1/notes/nope")
      .send({ title: "x" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/projects/:id/notes/:noteId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes note", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockDeleteNote.mockResolvedValue(true);
    const res = await request(createApp()).delete("/api/projects/proj1/notes/abc");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("abc");
  });

  it("returns 404 for unknown note", async () => {
    mockGetProject.mockResolvedValue(PROJECT);
    mockDeleteNote.mockResolvedValue(false);
    const res = await request(createApp()).delete("/api/projects/proj1/notes/nope");
    expect(res.status).toBe(404);
  });
});
