export type SessionStatus = "starting" | "running" | "ended";

export interface Session {
  id: string;
  tmuxSessionName: string;
  folderPath: string;
  status: SessionStatus;
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
