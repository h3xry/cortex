export type SessionStatus = "starting" | "running" | "ended";

export type ActivityStatus = "unknown" | "idle" | "thinking" | "working" | "done" | "help" | "error";

export interface SessionActivity {
  status: ActivityStatus;
  toolName: string | null;
  lastEvent: string;
  lastEventAt: string;
}

export interface Session {
  id: string;
  folderPath: string;
  status: SessionStatus;
  allowedTools: string[];
  createdAt: string;
  endedAt: string | null;
  projectName: string | null;
  lastOutput: string;
  activity: SessionActivity;
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

export type WsMessage =
  | { type: "output"; data: string }
  | { type: "status"; status: SessionStatus }
  | { type: "error"; message: string };

export type WsClientMessage =
  | { type: "input"; data: string }
  | { type: "control"; key: string }
  | { type: "resize"; cols: number; rows: number };

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
  groupId: string | null;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isPrivate: boolean;
  createdAt: string;
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

// Git Review types

export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  authorName: string;
  authorEmail: string;
  committerName: string;
  committerEmail: string;
  date: string;
}

export interface CommitFile {
  filePath: string;
  status: GitChangeStatus;
  additions: number;
  deletions: number;
}

export interface Branch {
  name: string;
  shortHash: string;
  isCurrent: boolean;
  isRemote: boolean;
}

// Note types

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteMeta {
  id: string;
  title: string;
  tags: string[];
  pinned: boolean;
  snippet: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types

export type NotificationType =
  | "session_completed"
  | "session_error"
  | "waiting_input"
  | "long_running"
  | "git_conflict";

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  projectId: string;
  projectName: string;
  sessionId: string | null;
  title: string;
  message: string;
  targetUrl: string;
  timestamp: string;
  read: boolean;
}

export interface ProjectNotificationRules {
  session_completed: boolean;
  session_error: boolean;
  waiting_input: boolean;
  long_running: boolean;
  git_conflict: boolean;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  longRunningThreshold: number;
  projectRules: Record<string, ProjectNotificationRules>;
}
