import { Router } from "express";
import * as sessionManager from "../services/session-manager.js";
import * as projectStore from "../services/project-store.js";
import {
  MaxSessionsError,
  InvalidPathError,
  SessionNotFoundError,
} from "../errors.js";

export const sessionsRouter = Router();

sessionsRouter.post("/", async (req, res) => {
  const { folderPath, projectId, allowedTools } = req.body;

  let resolvedPath: string | undefined = folderPath;

  // Resolve path from projectId if provided
  if (projectId && typeof projectId === "string") {
    const project = await projectStore.getProject(projectId);
    if (!project) {
      res.status(400).json({ error: "Project not found" });
      return;
    }
    resolvedPath = project.path;
  }

  if (!resolvedPath || typeof resolvedPath !== "string") {
    res.status(400).json({ error: "folderPath or projectId is required" });
    return;
  }

  const tools: string[] = Array.isArray(allowedTools) ? allowedTools : [];

  try {
    const session = await sessionManager.createSession(resolvedPath, tools);
    res.status(201).json({
      id: session.id,
      folderPath: session.folderPath,
      status: session.status,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
    });
  } catch (err) {
    if (err instanceof MaxSessionsError) {
      res.status(409).json({ error: err.message });
    } else if (err instanceof InvalidPathError) {
      res.status(400).json({ error: err.message });
    } else {
      console.error("Session creation error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

sessionsRouter.get("/", async (_req, res) => {
  try {
    const sessions = sessionManager.listSessions();
    const projects = await projectStore.listProjects();

    res.json({
      sessions: sessions.map((s) => {
        const matchedProject = projects.find((p) => p.path === s.folderPath);
        return {
          id: s.id,
          folderPath: s.folderPath,
          status: s.status,
          createdAt: s.createdAt,
          endedAt: s.endedAt,
          projectName: matchedProject?.name ?? null,
          lastOutput: sessionManager.getLastOutput(s.id),
        };
      }),
    });
  } catch (err) {
    console.error("Session list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

sessionsRouter.delete("/:id", async (req, res) => {
  try {
    const session = sessionManager.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.status === "running" || session.status === "starting") {
      // Kill running session then remove
      await sessionManager.deleteSession(req.params.id);
    }
    // Remove from memory (works for both ended and just-killed)
    sessionManager.removeSession(req.params.id);
    res.json({ id: session.id, status: "ended" });
  } catch (err) {
    if (err instanceof SessionNotFoundError) {
      res.status(404).json({ error: "Session not found" });
    } else {
      console.error("Session deletion error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});
