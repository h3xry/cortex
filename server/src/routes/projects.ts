import { Router } from "express";
import * as projectStore from "../services/project-store.js";
import * as settingsStore from "../services/settings-store.js";
import { verifyPassword } from "../services/crypto.js";

export const projectsRouter = Router();

projectsRouter.get("/", async (_req, res) => {
  const projects = await projectStore.listProjects();
  res.json({ projects });
});

projectsRouter.post("/", async (req, res) => {
  const { path: projectPath } = req.body;
  if (!projectPath || typeof projectPath !== "string") {
    res.status(400).json({ error: "path is required" });
    return;
  }

  try {
    const project = await projectStore.addProject(projectPath);
    res.status(201).json(project);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add project";
    if (message === "Project already added") {
      res.status(409).json({ error: message });
    } else if (message === "Path does not exist") {
      res.status(400).json({ error: message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

projectsRouter.patch("/:id/private", async (req, res) => {
  try {
    const { isPrivate, password } = req.body;

    if (typeof isPrivate !== "boolean" || !password || typeof password !== "string") {
      res.status(400).json({ error: "isPrivate (boolean) and password (string) are required" });
      return;
    }

    const hash = await settingsStore.getPasswordHash();
    if (!hash) {
      res.status(400).json({ error: "No private password set. Call POST /api/private/setup first" });
      return;
    }

    const valid = await verifyPassword(password, hash);
    if (!valid) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    const project = await projectStore.setPrivate(req.params.id, isPrivate);
    res.json(project);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Project not found") {
      res.status(404).json({ error: "Project not found" });
    } else {
      console.error("Project set-private error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

projectsRouter.delete("/:id", async (req, res) => {
  try {
    await projectStore.removeProject(req.params.id);
    res.json({ id: req.params.id });
  } catch {
    res.status(404).json({ error: "Project not found" });
  }
});
