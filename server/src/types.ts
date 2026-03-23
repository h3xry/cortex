export type SessionStatus = "starting" | "running" | "ended";

export interface Session {
  id: string;
  tmuxSessionName: string;
  folderPath: string;
  status: SessionStatus;
  allowedTools: string[];
  createdAt: string;
  endedAt: string | null;
}

export interface FolderEntry {
  name: string;
  path: string;
  hasChildren: boolean;
}

export interface FolderListResponse {
  current: string;
  parent: string | null;
  entries: FolderEntry[];
}

export type WsServerMessage =
  | { type: "output"; data: string }
  | { type: "status"; status: SessionStatus }
  | { type: "error"; message: string };

export type WsClientMessage =
  | { type: "input"; data: string }
  | { type: "control"; key: string };

export type WsMessage = WsServerMessage;

export interface ToolConfig {
  name: string;
  displayName: string;
  category: "file" | "system" | "web" | "agent";
}

export interface ToolPreset {
  name: string;
  tools: string[];
}

// Project Manager types

export interface Project {
  id: string;
  name: string;
  path: string;
  isGitRepo: boolean;
  addedAt: string;
}

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number | null;
}

export type GitChangeStatus = "modified" | "added" | "deleted" | "renamed";

export interface GitChange {
  filePath: string;
  status: GitChangeStatus;
  additions: number;
  deletions: number;
}

export interface DiffLine {
  type: "add" | "delete" | "context";
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffHunk {
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
}

export interface GitDiff {
  filePath: string;
  hunks: DiffHunk[];
}
