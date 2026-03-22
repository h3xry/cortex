import { Router } from "express";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { FolderEntry, FolderListResponse } from "../types.js";
import { isPathWithinRoot } from "../services/path-guard.js";

export const foldersRouter = Router();

foldersRouter.get("/", async (req, res) => {
  try {
    const requestedPath =
      typeof req.query.path === "string" ? req.query.path : os.homedir();
    const resolved = path.resolve(requestedPath);

    if (!isPathWithinRoot(resolved)) {
      res.status(403).json({ error: "Path outside allowed root" });
      return;
    }

    const stats = await stat(resolved).catch(() => null);
    if (!stats || !stats.isDirectory()) {
      res.status(404).json({ error: "Path not found" });
      return;
    }

    const dirents = await readdir(resolved, { withFileTypes: true });
    const entries: FolderEntry[] = [];

    for (const dirent of dirents) {
      if (!dirent.isDirectory() || dirent.name.startsWith(".")) continue;

      const fullPath = path.join(resolved, dirent.name);

      let hasChildren = false;
      try {
        const children = await readdir(fullPath, { withFileTypes: true });
        hasChildren = children.some(
          (c) => c.isDirectory() && !c.name.startsWith("."),
        );
      } catch {
        // No read permission — skip hasChildren check
      }

      entries.push({
        name: dirent.name,
        path: fullPath,
        hasChildren,
      });
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    const parent = path.dirname(resolved);
    const response: FolderListResponse = {
      current: resolved,
      parent: parent !== resolved && isPathWithinRoot(parent) ? parent : null,
      entries,
    };

    res.json(response);
  } catch {
    res.status(400).json({ error: "Invalid path" });
  }
});
