import { useState, useEffect, useCallback } from "react";
import type { FolderEntry, FolderListResponse } from "../types";

interface AddProjectProps {
  onAdd: (path: string) => Promise<void>;
}

export function AddProject({ onAdd }: AddProjectProps) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<FolderEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async (path?: string) => {
    setLoading(true);
    try {
      const url = path
        ? `/api/folders?path=${encodeURIComponent(path)}`
        : "/api/folders";
      const res = await fetch(url);
      if (res.ok) {
        const data: FolderListResponse = await res.json();
        setCurrentPath(data.current);
        setParentPath(data.parent);
        setEntries(data.entries);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showBrowser) {
      fetchFolders();
    }
  }, [showBrowser, fetchFolders]);

  const handleSelect = async () => {
    if (!currentPath) return;
    setAdding(true);
    setError(null);
    try {
      await onAdd(currentPath);
      setShowBrowser(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setAdding(false);
    }
  };

  if (!showBrowser) {
    return (
      <div className="add-project">
        <button
          className="add-project-open-button"
          onClick={() => setShowBrowser(true)}
        >
          + Add Project
        </button>
      </div>
    );
  }

  return (
    <div className="folder-picker-overlay">
      <div className="folder-picker">
        <div className="folder-picker-header">
          <h3>Select Project Folder</h3>
          <button
            className="folder-picker-close"
            onClick={() => setShowBrowser(false)}
          >
            x
          </button>
        </div>

        <div className="folder-picker-path" title={currentPath}>
          {currentPath}
        </div>

        <div className="folder-picker-list">
          {parentPath && (
            <button
              className="folder-picker-item folder-parent"
              onClick={() => fetchFolders(parentPath)}
            >
              ..
            </button>
          )}

          {loading && <div className="loading">Loading...</div>}

          {!loading &&
            entries.map((entry) => (
              <button
                key={entry.path}
                className="folder-picker-item"
                onDoubleClick={() => fetchFolders(entry.path)}
                onClick={() => {
                  setCurrentPath(entry.path);
                }}
                title={entry.path}
              >
                <span>{entry.hasChildren ? "📂" : "📁"}</span>
                <span>{entry.name}</span>
              </button>
            ))}

          {!loading && entries.length === 0 && (
            <div className="empty-message">No folders</div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="folder-picker-actions">
          <button
            className="folder-picker-cancel"
            onClick={() => setShowBrowser(false)}
          >
            Cancel
          </button>
          <button
            className="folder-picker-select"
            onClick={handleSelect}
            disabled={!currentPath || adding}
          >
            {adding ? "Adding..." : "Add This Folder"}
          </button>
        </div>
      </div>
    </div>
  );
}
