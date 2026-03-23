import { Router } from "express";
import type { ToolConfig, ToolPreset } from "../types.js";

export const toolsRouter = Router();

const TOOLS: ToolConfig[] = [
  { name: "Read", displayName: "Read Files", category: "file" },
  { name: "Write", displayName: "Write Files", category: "file" },
  { name: "Edit", displayName: "Edit Files", category: "file" },
  { name: "Glob", displayName: "Find Files", category: "file" },
  { name: "Grep", displayName: "Search Content", category: "file" },
  { name: "NotebookEdit", displayName: "Edit Notebooks", category: "file" },
  { name: "Bash", displayName: "Run Commands", category: "system" },
  { name: "TodoRead", displayName: "Read Tasks", category: "system" },
  { name: "TodoWrite", displayName: "Write Tasks", category: "system" },
  { name: "WebFetch", displayName: "Fetch URLs", category: "web" },
  { name: "WebSearch", displayName: "Web Search", category: "web" },
  { name: "Agent", displayName: "Sub-agents", category: "agent" },
  { name: "AskUserQuestion", displayName: "Ask Questions", category: "agent" },
];

const PRESETS: ToolPreset[] = [
  { name: "Full Access", tools: [] },
  {
    name: "Read Only",
    tools: ["Read", "Glob", "Grep", "WebFetch", "WebSearch"],
  },
  {
    name: "Safe Mode",
    tools: ["Read", "Glob", "Grep", "AskUserQuestion"],
  },
];

toolsRouter.get("/", (_req, res) => {
  res.json({ tools: TOOLS, presets: PRESETS });
});
