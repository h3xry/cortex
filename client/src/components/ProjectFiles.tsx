import { useState, useEffect } from "react";
import type { FileEntry, GitChange } from "../types";

interface ProjectFilesProps {
  projectId: string;
  entries: FileEntry[];
  loading: boolean;
  gitChanges: GitChange[];
  selectedFile: string | null;
  onNavigate: (path: string) => void;
  onOpenFile: (path: string) => void;
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  modified: { label: "M", color: "#f9e2af" },
  added: { label: "A", color: "#a6e3a1" },
  deleted: { label: "D", color: "#f38ba8" },
  renamed: { label: "R", color: "#89b4fa" },
};

export function ProjectFiles({
  projectId,
  entries,
  loading,
  gitChanges,
  selectedFile,
  onNavigate,
  onOpenFile,
}: ProjectFilesProps) {
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    setCurrentPath("");
    onNavigate("");
  }, [projectId]);

  // Build a map of file path → git status
  const changeMap = new Map(gitChanges.map((c) => [c.filePath, c]));

  // Check if a directory contains changed files
  const dirHasChanges = (dirPath: string) => {
    const prefix = dirPath ? dirPath + "/" : "";
    return gitChanges.some((c) => c.filePath.startsWith(prefix));
  };

  const handleClick = (entry: FileEntry) => {
    if (entry.type === "directory") {
      setCurrentPath(entry.path);
      onNavigate(entry.path);
    } else {
      onOpenFile(entry.path);
    }
  };

  const handleGoUp = () => {
    const parent = currentPath.split("/").slice(0, -1).join("/");
    setCurrentPath(parent);
    onNavigate(parent);
  };

  return (
    <div className="project-files">
      <div className="files-header">
        <span className="files-path">/{currentPath || "."}</span>
      </div>

      <div className="files-list">
        {currentPath && (
          <button className="file-item file-parent" onClick={handleGoUp}>
            ..
          </button>
        )}

        {loading && <div className="loading">Loading...</div>}

        {!loading &&
          entries.map((entry) => {
            const change = changeMap.get(entry.path);
            const hasNestedChanges =
              entry.type === "directory" && dirHasChanges(entry.path);
            const statusInfo = change
              ? STATUS_STYLE[change.status]
              : null;

            return (
              <button
                key={entry.path}
                className={`file-item ${selectedFile === entry.path ? "active" : ""}`}
                onClick={() => handleClick(entry)}
              >
                <span className="file-icon">
                  {entry.type === "directory" ? "📁" : "📄"}
                </span>
                <span className="file-name">{entry.name}</span>
                {statusInfo && (
                  <span
                    className="file-git-badge"
                    style={{ color: statusInfo.color }}
                    title={change!.status}
                  >
                    {statusInfo.label}
                  </span>
                )}
                {hasNestedChanges && !statusInfo && (
                  <span className="file-git-dot" title="Contains changes">
                    *
                  </span>
                )}
                {entry.size !== null && (
                  <span className="file-size">
                    {entry.size > 1024
                      ? `${(entry.size / 1024).toFixed(1)}KB`
                      : `${entry.size}B`}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
