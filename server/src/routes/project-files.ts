import { Router } from "express";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import * as projectStore from "../services/project-store.js";

export const projectFilesRouter = Router({ mergeParams: true });

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

const LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  md: "markdown",
  css: "css",
  html: "html",
  py: "python",
  go: "go",
  rs: "rust",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  sql: "sql",
  graphql: "graphql",
  xml: "markup",
  svg: "markup",
};

function isWithinProject(projectPath: string, targetPath: string): boolean {
  const resolved = path.resolve(projectPath, targetPath);
  return (
    resolved === projectPath || resolved.startsWith(projectPath + path.sep)
  );
}

projectFilesRouter.get("/", async (req, res) => {
  const project = await projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const relPath = typeof req.query.path === "string" ? req.query.path : "";
  const fullPath = path.resolve(project.path, relPath);

  if (!isWithinProject(project.path, relPath)) {
    res.status(403).json({ error: "Path outside project" });
    return;
  }

  try {
    const dirents = await readdir(fullPath, { withFileTypes: true });
    const entries = [];

    for (const dirent of dirents) {
      if (dirent.name.startsWith(".")) continue;
      if (dirent.name === "node_modules") continue;

      const entryRelPath = relPath ? `${relPath}/${dirent.name}` : dirent.name;
      let size: number | null = null;

      if (dirent.isFile()) {
        try {
          const stats = await stat(path.join(fullPath, dirent.name));
          size = stats.size;
        } catch {
          // skip
        }
      }

      entries.push({
        name: dirent.name,
        path: entryRelPath,
        type: dirent.isDirectory() ? "directory" : "file",
        size,
      });
    }

    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ entries });
  } catch {
    res.status(404).json({ error: "Path not found" });
  }
});

projectFilesRouter.get("/content", async (req, res) => {
  const project = await projectStore.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const relPath = req.query.path;
  if (!relPath || typeof relPath !== "string") {
    res.status(400).json({ error: "path query parameter is required" });
    return;
  }

  if (!isWithinProject(project.path, relPath)) {
    res.status(403).json({ error: "Path outside project" });
    return;
  }

  const fullPath = path.resolve(project.path, relPath);

  try {
    const stats = await stat(fullPath);
    if (stats.size > MAX_FILE_SIZE) {
      res.status(400).json({ error: "File too large (max 1MB)" });
      return;
    }

    const content = await readFile(fullPath, "utf-8");
    const ext = path.extname(relPath).slice(1).toLowerCase();
    const language = LANGUAGE_MAP[ext] ?? "text";

    res.json({ path: relPath, content, language, size: stats.size });
  } catch {
    res.status(404).json({ error: "File not found" });
  }
});
