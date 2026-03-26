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

  const [branch, changes, conflict] = await Promise.all([
    git.getBranch(project.path),
    git.getStatus(project.path),
    git.hasConflict(project.path),
  ]);

  res.json({ isGitRepo: true, branch, changes, hasConflict: conflict });
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

// --- Git Review Endpoints ---

projectGitRouter.get("/log", async (req, res) => {
  const project = await projectStore.getProject(req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const skip = parseInt(req.query.skip as string) || 0;

  const commits = await git.getLog(project.path, limit, skip);
  res.json({ commits });
});

projectGitRouter.get("/commits/:hash/files", async (req, res) => {
  const project = await projectStore.getProject(req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  try {
    const files = await git.getCommitFiles(project.path, req.params.hash);
    // Get commit detail
    const commits = await git.getLog(project.path, 1, 0);
    const allCommits = await git.getLog(project.path, 200, 0);
    const commit = allCommits.find((c) => c.hash === req.params.hash || c.shortHash === req.params.hash);
    res.json({ commit: commit ?? null, files });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

projectGitRouter.get("/commits/:hash/diff", async (req, res) => {
  const project = await projectStore.getProject(req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const file = req.query.file;
  if (!file || typeof file !== "string") {
    res.status(400).json({ error: "file query parameter is required" });
    return;
  }

  try {
    const diff = await git.getCommitDiff(project.path, req.params.hash, file);
    res.json(diff);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

projectGitRouter.get("/branches", async (req, res) => {
  const project = await projectStore.getProject(req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const result = await git.listBranches(project.path);
  res.json(result);
});

projectGitRouter.post("/checkout", async (req, res) => {
  const project = await projectStore.getProject(req.params.id);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const { branch } = req.body;
  if (!branch || typeof branch !== "string") {
    res.status(400).json({ error: "branch is required" });
    return;
  }

  const result = await git.checkoutBranch(project.path, branch);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});
