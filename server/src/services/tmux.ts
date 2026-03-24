import { execFile, spawn, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

function validateSessionName(name: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Invalid tmux session name: ${name}`);
  }
}

export async function createSession(
  sessionName: string,
  folderPath: string,
  command: string,
): Promise<void> {
  validateSessionName(sessionName);
  await execFileAsync("tmux", [
    "new-session",
    "-d",
    "-s",
    sessionName,
    "-c",
    folderPath,
    "sh",
    "-c",
    command,
  ]);
}

export async function resizeWindow(
  sessionName: string,
  cols: number,
  rows: number,
): Promise<void> {
  validateSessionName(sessionName);
  await execFileAsync("tmux", [
    "resize-window",
    "-t",
    sessionName,
    "-x",
    String(cols),
    "-y",
    String(rows),
  ]);
}

export async function forceRedraw(sessionName: string): Promise<void> {
  validateSessionName(sessionName);
  // Send SIGWINCH to the pane process to force terminal redraw
  try {
    await execFileAsync("tmux", [
      "send-keys",
      "-t",
      sessionName,
      "",
      "",
    ]);
    // Also do a select-pane to trigger refresh
    await execFileAsync("tmux", [
      "select-pane",
      "-t",
      sessionName,
    ]);
  } catch {
    // ignore
  }
}

export async function sendKeys(
  sessionName: string,
  keys: string,
): Promise<void> {
  validateSessionName(sessionName);
  await execFileAsync("tmux", ["send-keys", "-t", sessionName, keys]);
}

export async function killSession(sessionName: string): Promise<void> {
  validateSessionName(sessionName);
  try {
    await execFileAsync("tmux", ["kill-session", "-t", sessionName]);
  } catch {
    // Session may already be dead
  }
}

export interface TmuxSessionInfo {
  name: string;
  createdAt: string;
  paneCurrentPath: string;
}

export async function listSessionsDetailed(): Promise<TmuxSessionInfo[]> {
  try {
    const { stdout } = await execFileAsync("tmux", [
      "list-sessions",
      "-F",
      "#{session_name}\t#{session_created}\t#{pane_current_path}",
    ]);
    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [name, created, panePath] = line.split("\t");
        return {
          name,
          createdAt: new Date(parseInt(created, 10) * 1000).toISOString(),
          paneCurrentPath: panePath || "",
        };
      });
  } catch {
    return [];
  }
}

export async function hasSession(sessionName: string): Promise<boolean> {
  validateSessionName(sessionName);
  try {
    await execFileAsync("tmux", ["has-session", "-t", sessionName]);
    return true;
  } catch {
    return false;
  }
}

export async function listSessions(): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("tmux", [
      "list-sessions",
      "-F",
      "#{session_name}",
    ]);
    return stdout.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export async function capturePaneOutput(
  sessionName: string,
  startLine = -500,
): Promise<string> {
  validateSessionName(sessionName);
  try {
    const { stdout } = await execFileAsync("tmux", [
      "capture-pane",
      "-t",
      sessionName,
      "-p",
      "-e",
      "-S",
      String(startLine),
    ]);
    return stdout;
  } catch {
    return "";
  }
}

const PIPE_DIR = path.join(tmpdir(), "cc-monitor");
mkdirSync(PIPE_DIR, { recursive: true });

export function getPipeFilePath(sessionName: string): string {
  return path.join(PIPE_DIR, `${sessionName}.log`);
}

export async function stopPipePane(sessionName: string): Promise<void> {
  validateSessionName(sessionName);
  try {
    // Calling pipe-pane without a command stops any existing pipe
    await execFileAsync("tmux", ["pipe-pane", "-t", sessionName]);
  } catch {
    // ignore — no pipe may be active
  }
}

export async function startPipePane(sessionName: string): Promise<void> {
  validateSessionName(sessionName);
  const filePath = getPipeFilePath(sessionName);
  // Stop any existing pipe first
  await stopPipePane(sessionName);
  // Start fresh pipe-pane
  await execFileAsync("tmux", [
    "pipe-pane",
    "-t",
    sessionName,
    "-o",
    `cat >> ${filePath}`,
  ]);
}

export function tailFile(
  filePath: string,
  onData: (data: Buffer) => void,
): ChildProcess {
  const child = spawn("tail", ["-f", "-c", "+0", filePath]);
  child.stdout.on("data", onData);
  child.stdout.on("error", (err) => {
    console.error(`[tail] stdout error for ${filePath}:`, err.message);
  });
  child.on("error", (err) => {
    console.error(`[tail] process error for ${filePath}:`, err.message);
  });
  return child;
}
