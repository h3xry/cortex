import type { GitChange } from "../types";

interface GitChangesProps {
  changes: GitChange[];
  branch: string | null;
  loading: boolean;
  isGitRepo: boolean;
  selectedFile: string | null;
  onSelectFile: (filePath: string) => void;
  onRefresh: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  modified: { label: "M", color: "#f9e2af" },
  added: { label: "A", color: "#a6e3a1" },
  deleted: { label: "D", color: "#f38ba8" },
  renamed: { label: "R", color: "#89b4fa" },
};

export function GitChanges({
  changes,
  branch,
  loading,
  isGitRepo,
  selectedFile,
  onSelectFile,
  onRefresh,
}: GitChangesProps) {
  if (!isGitRepo) {
    return <div className="placeholder">Not a git repository</div>;
  }

  return (
    <div className="git-changes">
      <div className="git-changes-header">
        <span className="git-branch">{branch ?? "unknown"}</span>
        <span className="git-change-count">{changes.length} changes</span>
        <button className="refresh-button" onClick={onRefresh}>
          {loading ? "..." : "↻"}
        </button>
      </div>

      <div className="git-file-list">
        {changes.length === 0 && !loading && (
          <div className="empty-message">No changes</div>
        )}

        {changes.map((change) => {
          const statusInfo = STATUS_LABELS[change.status] ?? {
            label: "?",
            color: "#6c7086",
          };
          return (
            <button
              key={change.filePath}
              className={`git-file-item ${selectedFile === change.filePath ? "active" : ""}`}
              onClick={() => onSelectFile(change.filePath)}
            >
              <span
                className="git-status-badge"
                style={{ color: statusInfo.color }}
              >
                {statusInfo.label}
              </span>
              <span className="git-file-name">{change.filePath}</span>
              {(change.additions > 0 || change.deletions > 0) && (
                <span className="git-line-counts">
                  {change.additions > 0 && (
                    <span className="git-additions">+{change.additions}</span>
                  )}
                  {change.deletions > 0 && (
                    <span className="git-deletions">-{change.deletions}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
