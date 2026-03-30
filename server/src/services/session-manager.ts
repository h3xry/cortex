import { randomUUID } from "node:crypto";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { StringDecoder } from "node:string_decoder";
import type { ChildProcess } from "node:child_process";
import type { Session, SessionStatus } from "../types.js";
import {
  MaxSessionsError,
  InvalidPathError,
  SessionNotFoundError,
} from "../errors.js";
import { isPathWithinRoot } from "./path-guard.js";
import * as tmux from "./tmux.js";

const MAX_SESSIONS = 10;
const OUTPUT_BUFFER_SIZE = 100 * 1024; // 100KB

const TAIL_MAX_RETRIES = 3;
const TAIL_RETRY_WINDOW_MS = 30_000;

interface SessionEntry {
  session: Session;
  outputBuffer: string;
  listeners: Set<(data: string) => void>;
  tailProcess: ChildProcess | null;
  statusInterval: ReturnType<typeof setInterval> | null;
  tailRestartCount: number;
  tailLastRestartAt: number;
  failedChecks: number;
}

const sessions = new Map<string, SessionEntry>();

/**
 * Reconnect existing tmux cc-* sessions on server startup.
 * Scans tmux for sessions with "cc-" prefix and re-registers them.
 */
export async function reconnectSessions(): Promise<number> {
  const tmuxSessions = await tmux.listSessionsDetailed();
  const ccSessions = tmuxSessions.filter((s) => s.name.startsWith("cc-"));
  let reconnected = 0;

  for (const ts of ccSessions) {
    const id = ts.name.replace("cc-", "");

    // Skip if already in memory
    if (sessions.has(id)) continue;

    const folderPath = ts.paneCurrentPath ? path.resolve(ts.paneCurrentPath) : "/unknown";

    const session: Session = {
      id,
      tmuxSessionName: ts.name,
      folderPath,
      status: "running",
      allowedTools: [],
      createdAt: ts.createdAt,
      endedAt: null,
    };

    const entry: SessionEntry = {
      session,
      outputBuffer: "",
      listeners: new Set(),
      tailProcess: null,
      statusInterval: null,
      tailRestartCount: 0,
      tailLastRestartAt: 0,
      failedChecks: 0,
    };

    sessions.set(id, entry);

    // Re-setup pipe-pane + tail for this session
    try {
      const logFile = tmux.getPipeFilePath(ts.name);
      await writeFile(logFile, "");
      await tmux.startPipePane(ts.name);
      startOutputStream(entry);
      reconnected++;
      console.log(`[reconnect] Restored session ${id} (${folderPath})`);
    } catch (err) {
      console.error(`[reconnect] Failed to restore session ${id}:`, err);
      updateStatus(entry, "ended");
    }
  }

  return reconnected;
}

export async function validateFolderPath(folderPath: string): Promise<string> {
  const resolved = path.resolve(folderPath);

  if (!isPathWithinRoot(resolved)) {
    throw new InvalidPathError("Path outside allowed root");
  }

  const stats = await stat(resolved).catch(() => null);
  if (!stats) {
    throw new InvalidPathError("Folder does not exist");
  }
  if (!stats.isDirectory()) {
    throw new InvalidPathError("Path is not a directory");
  }
  return resolved;
}

export async function createSession(
  folderPath: string,
  allowedTools: string[] = [],
  continueConversation = false,
  sessionType: import("../types.js").SessionType = "claude",
): Promise<Session> {
  const activeSessions = Array.from(sessions.values()).filter(
    (e) => e.session.status !== "ended",
  );
  if (activeSessions.length >= MAX_SESSIONS) {
    throw new MaxSessionsError(MAX_SESSIONS);
  }

  const resolvedPath = await validateFolderPath(folderPath);
  const id = randomUUID().slice(0, 8);
  const tmuxSessionName = `cc-${id}`;

  const session: Session = {
    id,
    tmuxSessionName,
    folderPath: resolvedPath,
    status: "starting",
    sessionType,
    allowedTools: sessionType === "shell" ? [] : allowedTools,
    createdAt: new Date().toISOString(),
    endedAt: null,
  };

  const entry: SessionEntry = {
    session,
    outputBuffer: "",
    listeners: new Set(),
    tailProcess: null,
    statusInterval: null,
    tailRestartCount: 0,
    tailLastRestartAt: 0,
    failedChecks: 0,
  };

  sessions.set(id, entry);

  try {
    // Create empty log file first
    const logFile = tmux.getPipeFilePath(tmuxSessionName);
    await writeFile(logFile, "");

    let command: string;

    if (sessionType === "shell") {
      // Plain shell — use user's default shell or bash
      command = process.env.SHELL || "bash";
    } else {
      // Claude Code session
      command = "claude --dangerously-skip-permissions";
      if (continueConversation) {
        command += " --continue";
      }
      if (allowedTools.length > 0) {
        const toolNamePattern = /^[a-zA-Z0-9_:.-]+$/;
        const sanitized = allowedTools.filter((t) => toolNamePattern.test(t));
        if (sanitized.length > 0) {
          const toolsArg = sanitized.join(",");
          command += ` --allowedTools "${toolsArg}"`;
        }
      }
    }

    await tmux.createSession(tmuxSessionName, resolvedPath, command);

    // Start pipe-pane to capture raw PTY output
    await tmux.startPipePane(tmuxSessionName);

    // Wait for pipe-pane to start writing before tailing
    await waitForPipePane(logFile);

    // Auto-accept the workspace trust dialog (Claude Code only)
    if (sessionType === "claude") {
      setTimeout(async () => {
        try {
          await tmux.sendKeys(tmuxSessionName, "Enter");
        } catch {
          // Session may have ended already
        }
      }, 2000);
    }

    session.status = "running";
    startOutputStream(entry);
  } catch (err) {
    session.status = "ended";
    session.endedAt = new Date().toISOString();
    throw err;
  }

  return session;
}

async function waitForPipePane(logFile: string, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const stats = await stat(logFile);
      if (stats.size > 0) return;
    } catch {
      // File may not exist yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  // Timeout — proceed anyway, tail -f will pick up writes when they arrive
}

function startOutputStream(entry: SessionEntry): void {
  const logFile = tmux.getPipeFilePath(entry.session.tmuxSessionName);
  const decoder = new StringDecoder("utf8");

  // Tail the log file to get raw PTY output
  const child = tmux.tailFile(logFile, (data: Buffer) => {
    const text = decoder.write(data);
    appendOutput(entry, text);
    for (const listener of entry.listeners) {
      try {
        listener(text);
      } catch (err) {
        console.error(`[session ${entry.session.id}] listener error, removing:`, err);
        entry.listeners.delete(listener);
      }
    }
  });

  entry.tailProcess = child;

  child.on("exit", (code) => {
    entry.tailProcess = null;

    // Session already ended — no restart needed
    if (entry.session.status === "ended") return;

    // Check if tmux session is still alive
    tmux.hasSession(entry.session.tmuxSessionName).then((alive) => {
      if (!alive) {
        console.log(`[session ${entry.session.id}] tmux session gone, marking ended`);
        updateStatus(entry, "ended");
        return;
      }

      // Circuit breaker: reset counter if outside retry window
      const now = Date.now();
      if (now - entry.tailLastRestartAt > TAIL_RETRY_WINDOW_MS) {
        entry.tailRestartCount = 0;
      }

      if (entry.tailRestartCount >= TAIL_MAX_RETRIES) {
        console.error(`[session ${entry.session.id}] tail recovery failed after ${TAIL_MAX_RETRIES} retries`);
        return;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, entry.tailRestartCount);
      entry.tailRestartCount++;
      entry.tailLastRestartAt = now;

      console.log(`[session ${entry.session.id}] tail exited (code=${code}), restarting in ${delay}ms (attempt ${entry.tailRestartCount}/${TAIL_MAX_RETRIES})`);

      setTimeout(() => {
        if (entry.session.status === "ended") return;
        startOutputStream(entry);
      }, delay);
    }).catch(() => {
      updateStatus(entry, "ended");
    });
  });

  // Poll for session liveness (require 3 consecutive failures before marking ended)
  entry.statusInterval = setInterval(async () => {
    try {
      const alive = await tmux.hasSession(entry.session.tmuxSessionName);
      if (alive) {
        entry.failedChecks = 0;
      } else {
        entry.failedChecks++;
        if (entry.failedChecks >= 3) {
          console.log(`[session ${entry.session.id}] tmux session gone after ${entry.failedChecks} consecutive checks, marking ended`);
          updateStatus(entry, "ended");
        } else {
          console.log(`[session ${entry.session.id}] has-session check failed (${entry.failedChecks}/3), will retry`);
        }
      }
    } catch {
      entry.failedChecks++;
      if (entry.failedChecks >= 3) {
        console.log(`[session ${entry.session.id}] has-session check errored ${entry.failedChecks} times, marking ended`);
        updateStatus(entry, "ended");
      } else {
        console.log(`[session ${entry.session.id}] has-session check error (${entry.failedChecks}/3), will retry`);
      }
    }
  }, 2000);
}

function appendOutput(entry: SessionEntry, data: string): void {
  entry.outputBuffer += data;
  if (entry.outputBuffer.length > OUTPUT_BUFFER_SIZE) {
    entry.outputBuffer = entry.outputBuffer.slice(-OUTPUT_BUFFER_SIZE);
  }
}

function updateStatus(entry: SessionEntry, status: SessionStatus): void {
  entry.session.status = status;
  if (status === "ended") {
    entry.session.endedAt = new Date().toISOString();
    if (entry.tailProcess) {
      entry.tailProcess.kill();
      entry.tailProcess = null;
    }
    if (entry.statusInterval) {
      clearInterval(entry.statusInterval);
      entry.statusInterval = null;
    }
  }
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id)?.session;
}

export function listSessions(): Session[] {
  return Array.from(sessions.values()).map((e) => e.session);
}

export async function deleteSession(id: string): Promise<Session> {
  const entry = sessions.get(id);
  if (!entry) {
    throw new SessionNotFoundError(id);
  }

  await tmux.killSession(entry.session.tmuxSessionName);
  updateStatus(entry, "ended");
  return entry.session;
}

export function getOutputBuffer(id: string): string {
  return sessions.get(id)?.outputBuffer ?? "";
}

// Strip ANSI escape codes from text
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b[()][^\n]|\x1b\[[\?]?[0-9;]*[hlm]/g, "");
}

export function getLastOutput(id: string): string {
  const buffer = sessions.get(id)?.outputBuffer ?? "";
  if (!buffer) return "";
  const stripped = stripAnsi(buffer);
  const lines = stripped.split("\n").filter((l) => l.trim().length > 0);
  const last = lines[lines.length - 1] ?? "";
  return last.trim().slice(0, 200);
}

export function removeSession(id: string): void {
  const entry = sessions.get(id);
  if (!entry) {
    throw new SessionNotFoundError(id);
  }
  if (entry.tailProcess) {
    entry.tailProcess.kill();
  }
  if (entry.statusInterval) {
    clearInterval(entry.statusInterval);
  }
  sessions.delete(id);
}

export function addOutputListener(
  id: string,
  listener: (data: string) => void,
): () => void {
  const entry = sessions.get(id);
  if (!entry) {
    throw new SessionNotFoundError(id);
  }
  entry.listeners.add(listener);
  return () => entry.listeners.delete(listener);
}

export function getSessionStatus(id: string): SessionStatus | undefined {
  return sessions.get(id)?.session.status;
}
