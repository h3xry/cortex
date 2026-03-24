import { Router } from "express";
import * as projectStore from "../services/project-store.js";
import * as groupStore from "../services/group-store.js";
import { isUnlockedHeader } from "../services/unlock-store.js";

export const projectsRouter = Router();

projectsRouter.get("/", async (req, res) => {
  try {
    const allProjects = await projectStore.listProjects();
    const unlocked = isUnlockedHeader(req.headers);
    if (unlocked) {
      res.json({ projects: allProjects });
      return;
    }
    // Filter: hide projects in private groups
    const privateGroupIds = await groupStore.getPrivateGroupIds();
    const projects = privateGroupIds.size > 0
      ? allProjects.filter((p) => !p.groupId || !privateGroupIds.has(p.groupId))
      : allProjects;
    res.json({ projects });
  } catch (err) {
    console.error("Project list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
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

projectsRouter.patch("/:id/group", async (req, res) => {
  try {
    const { groupId } = req.body;
    if (groupId !== null && typeof groupId !== "string") {
      res.status(400).json({ error: "groupId must be a string or null" });
      return;
    }
    if (groupId !== null) {
      const group = await groupStore.getGroup(groupId);
      if (!group) {
        res.status(400).json({ error: "Group not found" });
        return;
      }
    }
    const project = await projectStore.setGroupId(req.params.id, groupId);
    res.json(project);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Project not found") {
      res.status(404).json({ error: "Project not found" });
    } else {
      console.error("Project set-group error:", err);
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
