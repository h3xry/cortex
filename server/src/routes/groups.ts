import { Router } from "express";
import * as groupStore from "../services/group-store.js";
import * as projectStore from "../services/project-store.js";

export const groupRouter = Router();

const MAX_NAME_LEN = 100;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// GET /api/groups
groupRouter.get("/", async (_req, res) => {
  try {
    const groups = await groupStore.listGroups();
    res.json({ groups });
  } catch (err) {
    console.error("Group list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/groups
groupRouter.post("/", async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    if (!name || typeof name !== "string" || name.length > MAX_NAME_LEN) {
      res.status(400).json({ error: "name is required (max 100 chars)" });
      return;
    }
    if (/[\r\n]/.test(name)) {
      res.status(400).json({ error: "name must not contain newlines" });
      return;
    }
    if (!icon || typeof icon !== "string") {
      res.status(400).json({ error: "icon is required" });
      return;
    }
    if (!color || typeof color !== "string" || !HEX_COLOR_RE.test(color)) {
      res.status(400).json({ error: "color must be hex format (#xxxxxx)" });
      return;
    }

    const group = await groupStore.createGroup({ name, icon, color });
    res.status(201).json(group);
  } catch (err) {
    console.error("Group create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/groups/:id
groupRouter.patch("/:id", async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || name.length > MAX_NAME_LEN || /[\r\n]/.test(name)) {
        res.status(400).json({ error: "Invalid name" });
        return;
      }
    }
    if (color !== undefined && (typeof color !== "string" || !HEX_COLOR_RE.test(color))) {
      res.status(400).json({ error: "color must be hex format (#xxxxxx)" });
      return;
    }

    const group = await groupStore.updateGroup(req.params.id, { name, icon, color });
    if (!group) {
      res.status(404).json({ error: "Group not found" });
      return;
    }
    res.json(group);
  } catch (err) {
    console.error("Group update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/groups/:id
groupRouter.delete("/:id", async (req, res) => {
  try {
    const deleted = await groupStore.deleteGroup(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Group not found" });
      return;
    }
    // Unlink projects from this group
    await projectStore.unlinkGroup(req.params.id);
    res.json({ id: req.params.id });
  } catch (err) {
    console.error("Group delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/groups/reorder
groupRouter.put("/reorder", async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.some((id: unknown) => typeof id !== "string")) {
      res.status(400).json({ error: "order must be an array of group ids" });
      return;
    }
    const ok = await groupStore.reorderGroups(order);
    if (!ok) {
      res.status(400).json({ error: "Invalid group ids in order" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Group reorder error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
