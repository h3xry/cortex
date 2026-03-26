import { Router } from "express";
import * as projectStore from "../services/project-store.js";
import * as retroStore from "../services/retro-store.js";

export const retrosRouter = Router();

retrosRouter.get("/retros", async (req, res) => {
  try {
    const projects = await projectStore.listProjects();
    const unlockToken = (req.headers["x-unlock-token"] as string) || null;
    const projectFilter = req.query.project as string | undefined;

    let retros = await retroStore.listRetros(projects, unlockToken);

    if (projectFilter) {
      retros = retros.filter((r) => r.projectId === projectFilter);
    }

    res.json({ retros });
  } catch (err) {
    res.status(500).json({ error: "Failed to list retros" });
  }
});

retrosRouter.get("/lessons", async (req, res) => {
  try {
    const projects = await projectStore.listProjects();
    const unlockToken = (req.headers["x-unlock-token"] as string) || null;
    const projectFilter = req.query.project as string | undefined;

    let lessons = await retroStore.listLessons(projects, unlockToken);

    if (projectFilter) {
      lessons = lessons.filter((l) => l.projectId === projectFilter);
    }

    res.json({ lessons });
  } catch (err) {
    res.status(500).json({ error: "Failed to list lessons" });
  }
});
