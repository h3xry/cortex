import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { PORT } from "../config.js";

const SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");
const HOOK_URL = `http://localhost:${PORT}/api/hooks`;

const HOOK_EVENTS = [
  "SessionStart",
  "SessionEnd",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "Stop",
  "TaskCompleted",
  "PermissionRequest",
  "UserPromptSubmit",
  "Notification",
];

export async function ensureHooksConfigured(): Promise<boolean> {
  try {
    let settings: Record<string, unknown> = {};

    try {
      const content = await readFile(SETTINGS_PATH, "utf-8");
      settings = JSON.parse(content);
    } catch {
      // File doesn't exist or invalid JSON
    }

    const hooks = (settings.hooks ?? {}) as Record<string, unknown[]>;
    let modified = false;

    for (const event of HOOK_EVENTS) {
      const handlers = (hooks[event] ?? []) as Array<{
        matcher?: string;
        hooks?: Array<{ type: string; url?: string; command?: string }>;
      }>;

      // Check if our HTTP hook is already registered
      const alreadyRegistered = handlers.some((h) =>
        h.hooks?.some(
          (hh) => hh.type === "http" && hh.url === HOOK_URL,
        ),
      );

      if (!alreadyRegistered) {
        handlers.push({
          matcher: "*",
          hooks: [
            {
              type: "http",
              url: HOOK_URL,
            },
          ],
        });
        hooks[event] = handlers;
        modified = true;
      }
    }

    if (modified) {
      settings.hooks = hooks;
      await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
      console.log(
        `[hooks] Configured ${HOOK_EVENTS.length} HTTP hook events → ${HOOK_URL}`,
      );
      return true;
    }

    return false;
  } catch (err) {
    console.error("[hooks] Failed to configure hooks:", err);
    return false;
  }
}

export async function cleanupOldCommandHooks(): Promise<void> {
  try {
    const content = await readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(content);
    const hooks = settings.hooks ?? {};
    let cleaned = 0;

    for (const event of Object.keys(hooks)) {
      const handlers = hooks[event] as Array<{
        hooks?: Array<{ type: string; command?: string }>;
      }>;
      hooks[event] = handlers.filter((h) => {
        const hasCcMonitor = h.hooks?.some(
          (hh) =>
            hh.type === "command" &&
            hh.command?.includes("cc-monitor-hook"),
        );
        if (hasCcMonitor) cleaned++;
        return !hasCcMonitor;
      });
    }

    if (cleaned > 0) {
      settings.hooks = hooks;
      await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
      console.log(`[hooks] Cleaned up ${cleaned} old command-type hooks`);
    }
  } catch {
    // ignore
  }
}
