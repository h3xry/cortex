import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import path from "node:path";
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
  pollInterval: ReturnType<typeof setInterval> | null;
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
    pollInterval: null,
  };

  sessions.set(id, entry);

  try {
    await tmux.createSession(
      tmuxSessionName,
      resolvedPath,
      "claude --dangerously-skip-permissions",
    );
    // Auto-accept the workspace trust dialog after a short delay
    setTimeout(async () => {
      try {
        await tmux.sendKeys(tmuxSessionName, "Enter");
      } catch {
        // Session may have ended already
      }
    }, 2000);
    session.status = "running";
    startOutputPolling(entry);
  } catch (err) {
    session.status = "ended";
    session.endedAt = new Date().toISOString();
    throw err;
  }

  return session;
}

function startOutputPolling(entry: SessionEntry): void {
  let lastOutput = "";

  entry.pollInterval = setInterval(async () => {
    try {
      const alive = await tmux.hasSession(entry.session.tmuxSessionName);
      if (!alive) {
        updateStatus(entry, "ended");
        return;
      }

      const output = await tmux.capturePaneOutput(
        entry.session.tmuxSessionName,
      );
      if (output !== lastOutput) {
        const newContent = output.slice(lastOutput.length);
        lastOutput = output;

        if (newContent) {
          appendOutput(entry, newContent);
          for (const listener of entry.listeners) {
            listener(newContent);
          }
        }
      }
    } catch (err) {
      console.error(
        `Polling error for session ${entry.session.id}:`,
        err,
      );
      updateStatus(entry, "ended");
    }
  }, 200);
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
    if (entry.pollInterval) {
      clearInterval(entry.pollInterval);
      entry.pollInterval = null;
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
