export type SessionStatus = "starting" | "running" | "ended";

export interface Session {
  id: string;
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

export type WsMessage =
  | { type: "output"; data: string }
  | { type: "status"; status: SessionStatus }
  | { type: "error"; message: string };

export type WsClientMessage =
  | { type: "input"; data: string }
  | { type: "control"; key: string };

export interface ToolConfig {
  name: string;
  displayName: string;
  category: "file" | "system" | "web" | "agent";
}

export interface ToolPreset {
  name: string;
  tools: string[];
}
