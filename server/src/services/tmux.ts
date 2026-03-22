import { execFile } from "node:child_process";
import { promisify } from "node:util";

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
      "-S",
      String(startLine),
    ]);
    return stdout;
  } catch {
    return "";
  }
}
