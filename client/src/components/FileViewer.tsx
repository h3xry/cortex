import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { DiffViewer } from "./DiffViewer";
import { MarkdownViewer } from "./MarkdownViewer";
import type { GitDiff } from "../types";

interface FileViewerProps {
  path: string;
  content: string;
  language: string;
  loading: boolean;
  hasChanges: boolean;
  diff: GitDiff | null;
  diffLoading: boolean;
  onClose: () => void;
}

export function FileViewer({
  path: filePath,
  content,
  language,
  loading,
  hasChanges,
  diff,
  diffLoading,
  onClose,
}: FileViewerProps) {
  const isMarkdown = filePath.endsWith(".md");
  const [viewMode, setViewMode] = useState<"render" | "code" | "diff">(
    hasChanges && diff && diff.hunks.length > 0
      ? "diff"
      : isMarkdown
        ? "render"
        : "code",
  );

  if (loading) {
    return (
      <div className="file-viewer">
        <div className="loading">Loading file...</div>
      </div>
    );
  }

  // Auto-select diff if file has changes with hunks
  const hasDiff = hasChanges && diff && diff.hunks.length > 0;

  return (
    <div className="file-viewer">
      <div className="file-viewer-header">
        <span className="file-viewer-path">{filePath}</span>
        <div className="file-viewer-actions">
          {isMarkdown && (
            <button
              className={`file-viewer-mode-button ${viewMode === "render" ? "active" : ""}`}
              onClick={() => setViewMode("render")}
            >
              Preview
            </button>
          )}
          <button
            className={`file-viewer-mode-button ${viewMode === "code" ? "active" : ""}`}
            onClick={() => setViewMode("code")}
          >
            Code
          </button>
          {hasDiff && (
            <button
              className={`file-viewer-mode-button ${viewMode === "diff" ? "active" : ""}`}
              onClick={() => setViewMode("diff")}
            >
              Diff
            </button>
          )}
          <button className="file-viewer-close" onClick={onClose}>
            x
          </button>
        </div>
      </div>

      {viewMode === "diff" && hasDiff ? (
        <DiffViewer
          diff={diff!}
          loading={diffLoading}
          onClose={() => setViewMode(isMarkdown ? "render" : "code")}
        />
      ) : viewMode === "render" && isMarkdown ? (
        <MarkdownViewer content={content} filePath={filePath} showHeader={false} />
      ) : (
        <div className="file-viewer-content">
          <Highlight theme={themes.vsDark} code={content} language={language}>
            {({ style, tokens, getLineProps, getTokenProps }) => (
              <pre style={{ ...style, margin: 0, padding: "12px" }}>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    <span className="line-number">{i + 1}</span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      )}
    </div>
  );
}
