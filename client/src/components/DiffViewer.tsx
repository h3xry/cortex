import { useState } from "react";
import type { GitDiff } from "../types";
import { SideBySideDiff } from "./SideBySideDiff";

type DiffMode = "unified" | "side-by-side";

interface DiffViewerProps {
  diff: GitDiff;
  loading: boolean;
  onClose: () => void;
}

export function DiffViewer({ diff, loading, onClose }: DiffViewerProps) {
  const [mode, setMode] = useState<DiffMode>("unified");

  if (loading) {
    return <div className="diff-viewer"><div className="loading">Loading diff...</div></div>;
  }

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <span className="diff-file-path">{diff.filePath}</span>
        <div className="diff-header-actions">
          <div className="diff-mode-toggle">
            <button
              className={`diff-mode-btn ${mode === "unified" ? "active" : ""}`}
              onClick={() => setMode("unified")}
            >
              Unified
            </button>
            <button
              className={`diff-mode-btn ${mode === "side-by-side" ? "active" : ""}`}
              onClick={() => setMode("side-by-side")}
            >
              Split
            </button>
          </div>
          <button className="diff-close" onClick={onClose}>x</button>
        </div>
      </div>

      {diff.hunks.length === 0 && (
        <div className="empty-message">No diff available</div>
      )}

      {mode === "unified" ? (
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
      ) : (
        <SideBySideDiff hunks={diff.hunks} />
      )}
    </div>
  );
}
