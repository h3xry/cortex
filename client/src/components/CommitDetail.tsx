import type { Commit, CommitFile } from "../types";

interface CommitDetailProps {
  commit: Commit;
  files: CommitFile[];
  loading: boolean;
  selectedFile: string | null;
  onSelectFile: (filePath: string) => void;
  onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  modified: "#f9e2af",
  added: "#a6e3a1",
  deleted: "#f38ba8",
  renamed: "#89b4fa",
};

const STATUS_LABELS: Record<string, string> = {
  modified: "M",
  added: "A",
  deleted: "D",
  renamed: "R",
};

export function CommitDetail({ commit, files, loading, selectedFile, onSelectFile, onBack }: CommitDetailProps) {
  const showCommitter = commit.committerName !== commit.authorName;

  return (
    <div className="commit-detail">
      <div className="commit-detail-header">
        <button className="commit-detail-back" onClick={onBack}>← Back</button>
      </div>

      <div className="commit-detail-info">
        <div className="commit-detail-message">{commit.message}</div>
        <div className="commit-detail-meta">
          <span className="commit-detail-author">
            {commit.authorName} &lt;{commit.authorEmail}&gt;
          </span>
          {showCommitter && (
            <span className="commit-detail-committer">
              Committer: {commit.committerName} &lt;{commit.committerEmail}&gt;
            </span>
          )}
          <span className="commit-detail-date">
            {new Date(commit.date).toLocaleString()}
          </span>
          <span className="commit-detail-hash">{commit.hash}</span>
        </div>
      </div>

      <div className="commit-detail-files-header">
        Files changed ({files.length})
      </div>

      {loading ? (
        <div className="commit-detail-loading">Loading files...</div>
      ) : (
        <div className="commit-detail-files">
          {files.map((f) => (
            <div
              key={f.filePath}
              className={`commit-file-item ${selectedFile === f.filePath ? "selected" : ""}`}
              onClick={() => onSelectFile(f.filePath)}
            >
              <span
                className="commit-file-status"
                style={{ color: STATUS_COLORS[f.status] || "#6c7086" }}
              >
                {STATUS_LABELS[f.status] || "?"}
              </span>
              <span className="commit-file-path">{f.filePath}</span>
              <span className="commit-file-stats">
                {f.additions > 0 && <span className="stat-add">+{f.additions}</span>}
                {f.deletions > 0 && <span className="stat-del">-{f.deletions}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
