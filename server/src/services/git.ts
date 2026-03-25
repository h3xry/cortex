import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access } from "node:fs/promises";
import path from "node:path";
import type { GitChange, GitChangeStatus, GitDiff, DiffHunk, DiffLine } from "../types.js";

const execFileAsync = promisify(execFile);

export async function isGitRepo(projectPath: string): Promise<boolean> {
  try {
    await access(path.join(projectPath, ".git"));
    return true;
  } catch {
    return false;
  }
}

export async function getBranch(projectPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["branch", "--show-current"],
      { cwd: projectPath },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function hasConflict(projectPath: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["status", "--porcelain"],
      { cwd: projectPath },
    );
    return stdout.split("\n").some((line) => line.startsWith("UU") || line.startsWith("AA") || line.startsWith("DD"));
  } catch {
    return false;
  }
}

export async function getStatus(projectPath: string): Promise<GitChange[]> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["status", "--porcelain", "-u"],
      { cwd: projectPath },
    );

    if (!stdout.trim()) return [];

    const changes: GitChange[] = [];
    for (const line of stdout.trim().split("\n")) {
      if (!line) continue;
      const statusCode = line.substring(0, 2).trim();
      const filePath = line.substring(2).trimStart();

      let status: GitChangeStatus;
      switch (statusCode) {
        case "M":
        case "MM":
        case "AM":
          status = "modified";
          break;
        case "A":
        case "??":
          status = "added";
          break;
        case "D":
          status = "deleted";
          break;
        case "R":
          status = "renamed";
          break;
        default:
          status = "modified";
      }

      changes.push({ filePath, status, additions: 0, deletions: 0 });
    }

    // Get line counts via numstat
    try {
      const { stdout: numstat } = await execFileAsync(
        "git",
        ["diff", "HEAD", "--numstat"],
        { cwd: projectPath },
      );
      for (const line of numstat.trim().split("\n")) {
        if (!line) continue;
        const [add, del, file] = line.split("\t");
        const change = changes.find((c) => c.filePath === file);
        if (change) {
          change.additions = add === "-" ? 0 : parseInt(add, 10);
          change.deletions = del === "-" ? 0 : parseInt(del, 10);
        }
      }
    } catch {
      // numstat may fail for new repos
    }

    return changes;
  } catch {
    return [];
  }
}

export async function getDiff(
  projectPath: string,
  filePath: string,
): Promise<GitDiff> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["diff", "HEAD", "--", filePath],
      { cwd: projectPath },
    );

    if (!stdout.trim()) {
      // Try diff for untracked files
      const { stdout: showStdout } = await execFileAsync(
        "git",
        ["diff", "--no-index", "/dev/null", filePath],
        { cwd: projectPath },
      ).catch(() => ({ stdout: "" }));

      return { filePath, hunks: parseDiffHunks(showStdout) };
    }

    return { filePath, hunks: parseDiffHunks(stdout) };
  } catch {
    return { filePath, hunks: [] };
  }
}

function parseDiffHunks(diffOutput: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const lines = diffOutput.split("\n");

  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    const hunkHeader = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkHeader) {
      currentHunk = {
        oldStart: parseInt(hunkHeader[1], 10),
        newStart: parseInt(hunkHeader[2], 10),
        lines: [],
      };
      oldLine = currentHunk.oldStart;
      newLine = currentHunk.newStart;
      hunks.push(currentHunk);
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith("+")) {
      const diffLine: DiffLine = {
        type: "add",
        content: line.substring(1),
        oldLineNumber: null,
        newLineNumber: newLine++,
      };
      currentHunk.lines.push(diffLine);
    } else if (line.startsWith("-")) {
      const diffLine: DiffLine = {
        type: "delete",
        content: line.substring(1),
        oldLineNumber: oldLine++,
        newLineNumber: null,
      };
      currentHunk.lines.push(diffLine);
    } else if (line.startsWith(" ")) {
      const diffLine: DiffLine = {
        type: "context",
        content: line.substring(1),
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
      };
      currentHunk.lines.push(diffLine);
    }
  }

  return hunks;
}
