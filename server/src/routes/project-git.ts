import { Router } from "express";
import * as projectStore from "../services/project-store.js";
import * as git from "../services/git.js";

export const projectGitRouter = Router({ mergeParams: true });

projectGitRouter.get("/status", async (req, res) => {
  const project = await projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const isRepo = await git.isGitRepo(project.path);
  if (!isRepo) {
    res.json({ isGitRepo: false, branch: null, changes: [] });
    return;
  }

  const [branch, changes] = await Promise.all([
    git.getBranch(project.path),
    git.getStatus(project.path),
  ]);

  res.json({ isGitRepo: true, branch, changes });
});

projectGitRouter.get("/diff", async (req, res) => {
  const project = await projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const file = req.query.file;
  if (!file || typeof file !== "string") {
    res.status(400).json({ error: "file query parameter is required" });
    return;
  }

  const diff = await git.getDiff(project.path, file);
  res.json(diff);
});
