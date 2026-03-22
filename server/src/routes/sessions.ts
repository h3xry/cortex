import { Router } from "express";
import * as sessionManager from "../services/session-manager.js";
import {
  MaxSessionsError,
  InvalidPathError,
  SessionNotFoundError,
} from "../errors.js";

export const sessionsRouter = Router();

sessionsRouter.post("/", async (req, res) => {
  const { folderPath } = req.body;
  if (!folderPath || typeof folderPath !== "string") {
    res.status(400).json({ error: "folderPath is required" });
    return;
  }

  try {
    const session = await sessionManager.createSession(folderPath);
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

sessionsRouter.get("/", (_req, res) => {
  const sessions = sessionManager.listSessions();
  res.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      folderPath: s.folderPath,
      status: s.status,
      createdAt: s.createdAt,
      endedAt: s.endedAt,
    })),
  });
});

sessionsRouter.delete("/:id", async (req, res) => {
  try {
    const session = await sessionManager.deleteSession(req.params.id);
    res.json({ id: session.id, status: session.status });
  } catch (err) {
    if (err instanceof SessionNotFoundError) {
      res.status(404).json({ error: "Session not found" });
    } else {
      console.error("Session deletion error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});
