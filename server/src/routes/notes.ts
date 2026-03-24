import { Router } from "express";
import * as projectStore from "../services/project-store.js";
import * as noteStore from "../services/note-store.js";
import { isUnlockedHeader } from "../services/unlock-store.js";

export const noteRouter = Router({ mergeParams: true });

type Params = { id: string; noteId?: string };

const MAX_TITLE_LEN = 200;

async function resolveProject(
  id: string,
  req: import("express").Request,
  res: import("express").Response,
): Promise<boolean> {
  const project = await projectStore.getProject(id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return false;
  }
  // Enforce private project unlock
  if (project.isPrivate && !isUnlockedHeader(req.headers)) {
    res.status(403).json({ error: "Project is private" });
    return false;
  }
  return true;
}

// GET /api/projects/:id/notes
noteRouter.get("/", async (req, res) => {
  try {
    const pid = (req.params as Params).id;
    if (!(await resolveProject(pid, req, res))) return;
    const notes = await noteStore.listNotes(pid);
    res.json({ notes });
  } catch (err) {
    console.error("Note list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/projects/:id/notes/:noteId
noteRouter.get("/:noteId", async (req, res) => {
  try {
    const pid = (req.params as Params).id;
    const nid = (req.params as Params).noteId!;
    if (!(await resolveProject(pid, req, res))) return;
    const note = await noteStore.getNote(pid, nid);
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.json(note);
  } catch (err) {
    console.error("Note get error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/projects/:id/notes
noteRouter.post("/", async (req, res) => {
  try {
    const pid = (req.params as Params).id;
    if (!(await resolveProject(pid, req, res))) return;

    const { title, content, tags } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || title.length > MAX_TITLE_LEN) {
        res.status(400).json({ error: `title must be <= ${MAX_TITLE_LEN} characters` });
        return;
      }
      if (/[\r\n]/.test(title)) {
        res.status(400).json({ error: "title must not contain newlines" });
        return;
      }
    }
    if (tags !== undefined && !Array.isArray(tags)) {
      res.status(400).json({ error: "tags must be an array" });
      return;
    }

    const note = await noteStore.createNote(pid, { title, content, tags });
    res.status(201).json(note);
  } catch (err) {
    console.error("Note create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/projects/:id/notes/:noteId
noteRouter.patch("/:noteId", async (req, res) => {
  try {
    const pid = (req.params as Params).id;
    const nid = (req.params as Params).noteId!;
    if (!(await resolveProject(pid, req, res))) return;

    const { title, content, tags, pinned } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || title.length > MAX_TITLE_LEN) {
        res.status(400).json({ error: `title must be <= ${MAX_TITLE_LEN} characters` });
        return;
      }
      if (/[\r\n]/.test(title)) {
        res.status(400).json({ error: "title must not contain newlines" });
        return;
      }
    }
    if (tags !== undefined && !Array.isArray(tags)) {
      res.status(400).json({ error: "tags must be an array" });
      return;
    }

    const note = await noteStore.updateNote(pid, nid, { title, content, tags, pinned });
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.json(note);
  } catch (err) {
    console.error("Note update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/projects/:id/notes/:noteId
noteRouter.delete("/:noteId", async (req, res) => {
  try {
    const pid = (req.params as Params).id;
    const nid = (req.params as Params).noteId!;
    if (!(await resolveProject(pid, req, res))) return;
    const deleted = await noteStore.deleteNote(pid, nid);
    if (!deleted) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.json({ id: nid });
  } catch (err) {
    console.error("Note delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
