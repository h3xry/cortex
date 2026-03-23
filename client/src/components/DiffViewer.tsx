import type { GitDiff } from "../types";

interface DiffViewerProps {
  diff: GitDiff;
  loading: boolean;
  onClose: () => void;
}

export function DiffViewer({ diff, loading, onClose }: DiffViewerProps) {
  if (loading) {
    return <div className="diff-viewer"><div className="loading">Loading diff...</div></div>;
  }

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <span className="diff-file-path">{diff.filePath}</span>
        <button className="diff-close" onClick={onClose}>
          x
        </button>
      </div>

      {diff.hunks.length === 0 && (
        <div className="empty-message">No diff available</div>
      )}

      <div className="diff-content">
        {diff.hunks.map((hunk, i) => (
          <div key={i} className="diff-hunk">
            <div className="diff-hunk-header">
              @@ -{hunk.oldStart} +{hunk.newStart} @@
            </div>
            {hunk.lines.map((line, j) => (
              <div key={j} className={`diff-line diff-line-${line.type}`}>
                <span className="diff-line-number diff-line-old">
                  {line.oldLineNumber ?? ""}
                </span>
                <span className="diff-line-number diff-line-new">
                  {line.newLineNumber ?? ""}
                </span>
                <span className="diff-line-prefix">
                  {line.type === "add" ? "+" : line.type === "delete" ? "-" : " "}
                </span>
                <span className="diff-line-content">{line.content}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
