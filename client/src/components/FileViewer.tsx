import { Highlight, themes } from "prism-react-renderer";
import { DiffViewer } from "./DiffViewer";
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
  if (loading) {
    return (
      <div className="file-viewer">
        <div className="loading">Loading file...</div>
      </div>
    );
  }

  // If file has changes and diff is loaded, show diff view
  if (hasChanges && diff) {
    return (
      <div className="file-viewer">
        <DiffViewer diff={diff} loading={diffLoading} onClose={onClose} />
      </div>
    );
  }

  // Otherwise show file content with syntax highlighting
  return (
    <div className="file-viewer">
      <div className="file-viewer-header">
        <span className="file-viewer-path">{filePath}</span>
        <button className="file-viewer-close" onClick={onClose}>
          x
        </button>
      </div>
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
    </div>
  );
}
