import { Router } from "express";
import * as projectStore from "../services/project-store.js";

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

projectsRouter.delete("/:id", async (req, res) => {
  try {
    await projectStore.removeProject(req.params.id);
    res.json({ id: req.params.id });
  } catch {
    res.status(404).json({ error: "Project not found" });
  }
});
