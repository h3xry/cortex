import type { FolderEntry } from "../types";

interface FolderBrowserProps {
  currentPath: string;
  parentPath: string | null;
  entries: FolderEntry[];
  selectedPath: string | null;
  loading: boolean;
  error: string | null;
  onNavigate: (path: string) => void;
  onGoUp: () => void;
  onSelect: (path: string) => void;
}

export function FolderBrowser({
  currentPath,
  parentPath,
  entries,
  selectedPath,
  loading,
  error,
  onNavigate,
  onGoUp,
  onSelect,
}: FolderBrowserProps) {
  return (
    <div className="folder-browser">
      <div className="folder-browser-header">
        <h3>Folders</h3>
        <div className="current-path" title={currentPath}>
          {currentPath}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="folder-list">
        {parentPath && (
          <button className="folder-item folder-parent" onClick={onGoUp}>
            ..
          </button>
        )}

        {loading && <div className="loading">Loading...</div>}

        {!loading &&
          entries.map((entry) => (
            <button
              key={entry.path}
              className={`folder-item ${selectedPath === entry.path ? "selected" : ""}`}
              onClick={() => onSelect(entry.path)}
              onDoubleClick={() => onNavigate(entry.path)}
              title={entry.path}
            >
              <span className="folder-icon">
                {entry.hasChildren ? "📂" : "📁"}
              </span>
              <span className="folder-name">{entry.name}</span>
            </button>
          ))}

        {!loading && entries.length === 0 && (
          <div className="empty-message">No folders</div>
        )}
      </div>

      {selectedPath && (
        <div className="selected-path">
          <strong>Selected:</strong> {selectedPath}
        </div>
      )}
    </div>
  );
}
