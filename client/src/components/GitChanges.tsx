import { useState, useEffect } from "react";
import type { GitChange, Commit, CommitFile, Branch, GitDiff } from "../types";
import { CommitList } from "./CommitList";
import { CommitDetail } from "./CommitDetail";
import { BranchSelector } from "./BranchSelector";

type ViewMode = "working" | "history";

interface GitChangesProps {
  changes: GitChange[];
  branch: string | null;
  loading: boolean;
  isGitRepo: boolean;
  selectedFile: string | null;
  onSelectFile: (filePath: string) => void;
  onRefresh: () => void;
  // History props
  commits: Commit[];
  selectedCommit: Commit | null;
  commitFiles: CommitFile[];
  historyLoading: boolean;
  filesLoading: boolean;
  hasMore: boolean;
  onSelectCommit: (commit: Commit) => void;
  onLoadMore: () => void;
  onSelectCommitFile: (hash: string, filePath: string) => void;
  onClearSelection: () => void;
  // Branch props
  branches: Branch[];
  currentBranch: string | null;
  onFetchBranches: () => void;
  onCheckout: (branch: string) => Promise<{ success: boolean; error?: string }>;
  onFetchLog: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  modified: { label: "M", color: "#f9e2af" },
  added: { label: "A", color: "#a6e3a1" },
  deleted: { label: "D", color: "#f38ba8" },
  renamed: { label: "R", color: "#89b4fa" },
};

export function GitChanges({
  changes, branch, loading, isGitRepo, selectedFile, onSelectFile, onRefresh,
  commits, selectedCommit, commitFiles, historyLoading, filesLoading, hasMore,
  onSelectCommit, onLoadMore, onSelectCommitFile, onClearSelection,
  branches, currentBranch, onFetchBranches, onCheckout, onFetchLog,
}: GitChangesProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("working");
  const [commitSelectedFile, setCommitSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === "history" && commits.length === 0) {
      onFetchLog();
    }
  }, [viewMode, commits.length, onFetchLog]);

  if (!isGitRepo) {
    return <div className="placeholder">Not a git repository</div>;
  }

  const handleSelectCommitFile = (filePath: string) => {
    if (!selectedCommit) return;
    setCommitSelectedFile(filePath);
    onSelectCommitFile(selectedCommit.hash, filePath);
  };

  return (
    <div className="git-changes">
      {/* View mode toggle */}
      <div className="git-view-toggle">
        <button
          className={`git-view-btn ${viewMode === "working" ? "active" : ""}`}
          onClick={() => setViewMode("working")}
        >
          Working Directory
        </button>
        <button
          className={`git-view-btn ${viewMode === "history" ? "active" : ""}`}
          onClick={() => setViewMode("history")}
        >
          History
        </button>
      </div>

      {/* Branch selector */}
      <BranchSelector
        currentBranch={currentBranch ?? branch}
        branches={branches}
        onFetchBranches={onFetchBranches}
        onCheckout={async (b) => {
          const result = await onCheckout(b);
          if (result.success) onRefresh();
          return result;
        }}
      />

      {viewMode === "working" ? (
        <>
          <div className="git-changes-header">
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
              const statusInfo = STATUS_LABELS[change.status] ?? { label: "?", color: "#6c7086" };
              return (
                <button
                  key={change.filePath}
                  className={`git-file-item ${selectedFile === change.filePath ? "active" : ""}`}
                  onClick={() => onSelectFile(change.filePath)}
                >
                  <span className="git-status-badge" style={{ color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                  <span className="git-file-name">{change.filePath}</span>
                  {(change.additions > 0 || change.deletions > 0) && (
                    <span className="git-line-counts">
                      {change.additions > 0 && <span className="git-additions">+{change.additions}</span>}
                      {change.deletions > 0 && <span className="git-deletions">-{change.deletions}</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : selectedCommit ? (
        <CommitDetail
          commit={selectedCommit}
          files={commitFiles}
          loading={filesLoading}
          selectedFile={commitSelectedFile}
          onSelectFile={handleSelectCommitFile}
          onBack={onClearSelection}
        />
      ) : (
        <CommitList
          commits={commits}
          selectedHash={null}
          loading={historyLoading}
          hasMore={hasMore}
          onSelect={onSelectCommit}
          onLoadMore={onLoadMore}
        />
      )}
    </div>
  );
}
