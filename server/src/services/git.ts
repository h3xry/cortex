import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access } from "node:fs/promises";
import path from "node:path";
import type { GitChange, GitChangeStatus, GitDiff, DiffHunk, DiffLine, Commit, CommitFile, Branch } from "../types.js";

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

// --- Git Review Functions ---

const LOG_FORMAT = "%H|%h|%s|%an|%ae|%cn|%ce|%aI";
const HASH_RE = /^[a-f0-9]{4,40}$/;
const BRANCH_NAME_RE = /^[a-zA-Z0-9_./-]+$/;

export async function getLog(projectPath: string, limit = 50, skip = 0, search?: string): Promise<Commit[]> {
  try {
    const args = ["log", `--format=${LOG_FORMAT}`, `-${limit}`, `--skip=${skip}`];

    if (search && search.trim()) {
      const q = search.trim();
      // Search in message + author — use --all-match=false (OR logic via separate git calls)
      // git log --grep searches commit message, --author searches author
      // We use --grep for message and fall back to hash match client-side
      args.push(`--grep=${q}`, "--regexp-ignore-case");
    }

    const { stdout } = await execFileAsync(
      "git",
      args,
      { cwd: projectPath },
    );

    if (!stdout.trim()) {
      // If grep found nothing, try searching by author
      if (search && search.trim()) {
        const authorArgs = ["log", `--format=${LOG_FORMAT}`, `-${limit}`, `--author=${search.trim()}`, "--regexp-ignore-case"];
        const { stdout: authorOut } = await execFileAsync("git", authorArgs, { cwd: projectPath });
        if (authorOut.trim()) {
          return authorOut.trim().split("\n").map((line) => {
            const [hash, shortHash, message, authorName, authorEmail, committerName, committerEmail, date] = line.split("|");
            return { hash, shortHash, message, authorName, authorEmail, committerName, committerEmail, date };
          });
        }
      }
      return [];
    }
    if (!stdout.trim()) return [];

    return stdout.trim().split("\n").map((line) => {
      const [hash, shortHash, message, authorName, authorEmail, committerName, committerEmail, date] = line.split("|");
      return { hash, shortHash, message, authorName, authorEmail, committerName, committerEmail, date };
    });
  } catch {
    return [];
  }
}

export async function getCommitFiles(projectPath: string, hash: string): Promise<CommitFile[]> {
  if (!HASH_RE.test(hash)) throw new Error("Invalid commit hash");
  try {
    // Get parent for status detection
    let parentHash: string | null = null;
    try {
      const { stdout: p } = await execFileAsync("git", ["rev-parse", `${hash}^`], { cwd: projectPath });
      parentHash = p.trim();
    } catch {
      // No parent = first commit
    }

    // Get numstat
    const diffArgs = parentHash
      ? ["diff", "--numstat", parentHash, hash]
      : ["diff-tree", "--no-commit-id", "-r", "--numstat", hash];

    const { stdout } = await execFileAsync("git", diffArgs, { cwd: projectPath });
    if (!stdout.trim()) return [];

    // Get name-status for add/delete/modify detection
    const statusArgs = parentHash
      ? ["diff", "--name-status", parentHash, hash]
      : ["diff-tree", "--no-commit-id", "-r", "--name-status", hash];

    const { stdout: statusOut } = await execFileAsync("git", statusArgs, { cwd: projectPath });
    const statusMap = new Map<string, GitChangeStatus>();
    for (const line of statusOut.trim().split("\n")) {
      if (!line) continue;
      const [code, ...rest] = line.split("\t");
      const filePath = rest.join("\t");
      const s = code.charAt(0);
      if (s === "A") statusMap.set(filePath, "added");
      else if (s === "D") statusMap.set(filePath, "deleted");
      else if (s === "R") statusMap.set(filePath, "renamed");
      else statusMap.set(filePath, "modified");
    }

    const files: CommitFile[] = [];
    for (const line of stdout.trim().split("\n")) {
      if (!line) continue;
      const [add, del, filePath] = line.split("\t");
      files.push({
        filePath,
        status: statusMap.get(filePath) ?? "modified",
        additions: add === "-" ? 0 : parseInt(add, 10),
        deletions: del === "-" ? 0 : parseInt(del, 10),
      });
    }
    return files;
  } catch {
    return [];
  }
}

export async function getCommitDiff(projectPath: string, hash: string, filePath: string): Promise<GitDiff> {
  if (!HASH_RE.test(hash)) throw new Error("Invalid commit hash");
  // Path containment check
  const resolved = path.resolve(projectPath, filePath);
  if (!resolved.startsWith(path.resolve(projectPath) + path.sep) && resolved !== path.resolve(projectPath)) {
    throw new Error("Path traversal detected");
  }

  try {
    let parentHash: string | null = null;
    try {
      const { stdout: p } = await execFileAsync("git", ["rev-parse", `${hash}^`], { cwd: projectPath });
      parentHash = p.trim();
    } catch {
      // first commit
    }

    const args = parentHash
      ? ["diff", parentHash, hash, "--", filePath]
      : ["diff", "--root", hash, "--", filePath];

    const { stdout } = await execFileAsync("git", args, { cwd: projectPath });
    return { filePath, hunks: parseDiffHunks(stdout) };
  } catch {
    return { filePath, hunks: [] };
  }
}

export async function listBranches(projectPath: string): Promise<{ branches: Branch[]; current: string | null }> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["branch", "-a", "--format=%(refname:short)|%(objectname:short)|%(HEAD)"],
      { cwd: projectPath },
    );
    if (!stdout.trim()) return { branches: [], current: null };

    let current: string | null = null;
    const branches: Branch[] = [];

    for (const line of stdout.trim().split("\n")) {
      const [name, shortHash, head] = line.split("|");
      if (!name || name.includes("HEAD")) continue;
      const isCurrent = head === "*";
      const isRemote = name.startsWith("origin/");
      if (isCurrent) current = name;
      branches.push({ name, shortHash, isCurrent, isRemote });
    }

    return { branches, current };
  } catch {
    return { branches: [], current: null };
  }
}

export async function checkoutBranch(projectPath: string, branch: string): Promise<{ success: boolean; error?: string }> {
  if (!BRANCH_NAME_RE.test(branch)) return { success: false, error: "Invalid branch name" };

  try {
    // Check dirty working tree
    const { stdout: status } = await execFileAsync("git", ["status", "--porcelain"], { cwd: projectPath });
    const isDirty = status.trim().length > 0;

    await execFileAsync("git", ["checkout", branch], { cwd: projectPath });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
