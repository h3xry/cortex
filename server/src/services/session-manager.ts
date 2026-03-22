import { randomUUID } from "node:crypto";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
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

interface SessionEntry {
  session: Session;
  outputBuffer: string;
  listeners: Set<(data: string) => void>;
  tailProcess: ChildProcess | null;
  statusInterval: ReturnType<typeof setInterval> | null;
}

const sessions = new Map<string, SessionEntry>();

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

export async function createSession(folderPath: string): Promise<Session> {
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
    createdAt: new Date().toISOString(),
    endedAt: null,
  };

  const entry: SessionEntry = {
    session,
    outputBuffer: "",
    listeners: new Set(),
    tailProcess: null,
    statusInterval: null,
  };

  sessions.set(id, entry);

  try {
    // Create empty log file first
    const logFile = tmux.getPipeFilePath(tmuxSessionName);
    await writeFile(logFile, "");

    await tmux.createSession(
      tmuxSessionName,
      resolvedPath,
      "claude --dangerously-skip-permissions",
    );

    // Start pipe-pane to capture raw PTY output
    await tmux.startPipePane(tmuxSessionName);

    // Auto-accept the workspace trust dialog after a short delay
    setTimeout(async () => {
      try {
        await tmux.sendKeys(tmuxSessionName, "Enter");
      } catch {
        // Session may have ended already
      }
    }, 2000);

    session.status = "running";
    startOutputStream(entry);
  } catch (err) {
    session.status = "ended";
    session.endedAt = new Date().toISOString();
    throw err;
  }

  return session;
}

function startOutputStream(entry: SessionEntry): void {
  const logFile = tmux.getPipeFilePath(entry.session.tmuxSessionName);

  // Tail the log file to get raw PTY output
  const child = tmux.tailFile(logFile, (data: Buffer) => {
    const text = data.toString();
    appendOutput(entry, text);
    for (const listener of entry.listeners) {
      listener(text);
    }
  });

  entry.tailProcess = child;

  child.on("exit", () => {
    entry.tailProcess = null;
  });

  // Poll for session liveness
  entry.statusInterval = setInterval(async () => {
    try {
      const alive = await tmux.hasSession(entry.session.tmuxSessionName);
      if (!alive) {
        updateStatus(entry, "ended");
      }
    } catch {
      updateStatus(entry, "ended");
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
